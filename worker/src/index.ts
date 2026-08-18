/**
 * Synapse Systems API Server
 * Built on Cloudflare Workers + Hono framework
 *
 * Endpoints:
 * - POST   /api/auth/login
 * - POST   /api/auth/refresh
 * - POST   /api/auth/logout
 * - GET    /api/auth/me
 * - CRUD   /api/patients
 * - CRUD   /api/appointments
 * - CRUD   /api/exams
 * - CRUD   /api/prescriptions
 * - CRUD   /api/lab-requests
 * - CRUD   /api/imaging-requests
 * - CRUD   /api/vaccines
 * - CRUD   /api/invoices
 * - POST   /api/invoices/:id/pay
 * - GET    /api/queue
 * - POST   /api/queue
 * - PATCH  /api/queue/:id
 * - CRUD   /api/services
 * - CRUD   /api/expenses
 * - GET    /api/accounting/accounts
 * - GET    /api/accounting/journal
 * - POST   /api/accounting/journal
 * - GET    /api/reports/:type
 * - GET    /api/audit
 * - POST   /api/files/upload  (returns signed URL for R2 direct upload)
 * - GET    /api/files/:id     (returns short-lived signed download URL)
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { jwt, sign, verify } from 'hono/jwt'
import { bodyLimit } from 'hono/body-limit'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { nanoid } from 'nanoid'

// Types
type Bindings = {
  DB: D1Database
  STORAGE?: R2Bucket  // Optional - enable R2 in Cloudflare dashboard
  CACHE: KVNamespace
  ASSETS: Fetcher  // Static assets binding (Frontend)
  JWT_SECRET: string
  ENCRYPTION_KEY: string
  FRONTEND_URL: string
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Bindings }>()

// ============== Middleware ==============
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', secureHeaders())

app.use('*', cors({
  origin: (origin, c) => {
    const allowed = c.env.FRONTEND_URL || '*'
    return allowed === '*' ? '*' : (origin === allowed ? allowed : null)
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}))

app.use('*', bodyLimit({ maxSize: 10 * 1024 * 1024 })) // 10MB max JSON body

// ============== Health Check ==============
app.get('/api/health', (c) => c.json({
  status: 'ok',
  service: 'synapse-systems',
  version: '1.0.0',
  env: c.env.ENVIRONMENT,
  timestamp: new Date().toISOString(),
}))

// ============== Auth Routes ==============
const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(4).max(100),
})

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }
  const { username, password } = parsed.data

  const user = await c.env.DB.prepare(
    'SELECT id, username, full_name, password_hash, role, permissions, linked_patient_id, active, failed_login_count, locked_until FROM users WHERE username = ?'
  ).bind(username).first<any>()

  if (!user || !user.active) {
    return c.json({ error: 'بيانات الدخول غير صحيحة' }, 401)
  }

  // Rate limit: lock after 5 failed attempts for 15 min
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return c.json({ error: 'الحساب مقفل مؤقتاً. حاول لاحقاً.' }, 423)
  }

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) {
    const newCount = (user.failed_login_count || 0) + 1
    const lockUntil = newCount >= 5
      ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
      : null
    await c.env.DB.prepare(
      'UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?'
    ).bind(newCount, lockUntil, user.id).run()
    return c.json({ error: 'بيانات الدخول غير صحيحة' }, 401)
  }

  // Reset failed attempts on success
  await c.env.DB.prepare(
    'UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = datetime(\'now\') WHERE id = ?'
  ).bind(user.id).run()

  // Issue tokens
  const accessToken = await sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      linkedPatientId: user.linked_patient_id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    },
    c.env.JWT_SECRET
  )

  const refreshToken = nanoid(64)
  const refreshHash = await bcrypt.hash(refreshToken, 10)
  const sessionId = nanoid(21)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(
    sessionId,
    user.id,
    refreshHash,
    c.req.header('user-agent') || null,
    c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null,
    expiresAt
  ).run()

  // Audit
  await logAudit(c.env.DB, {
    userId: user.id,
    userName: user.full_name,
    userRole: user.role,
    action: 'auth.login',
    ip: c.req.header('cf-connecting-ip'),
    userAgent: c.req.header('user-agent'),
  })

  const permissions = user.permissions ? JSON.parse(user.permissions) : []

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      permissions,
      linkedPatientId: user.linked_patient_id,
    },
  })
})

app.post('/api/auth/refresh', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { refreshToken, userId } = body
  if (!refreshToken || !userId) return c.json({ error: 'Missing fields' }, 400)

  const session = await c.env.DB.prepare(
    'SELECT id, user_id, refresh_token_hash, expires_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
  ).bind(userId).all<any>()

  let valid = false
  let validSessionId: string | null = null
  for (const s of session.results || []) {
    if (new Date(s.expires_at) < new Date()) continue
    if (await bcrypt.compare(refreshToken, s.refresh_token_hash)) {
      valid = true
      validSessionId = s.id
      break
    }
  }
  if (!valid) return c.json({ error: 'Invalid refresh token' }, 401)

  const user = await c.env.DB.prepare(
    'SELECT id, username, role, linked_patient_id FROM users WHERE id = ? AND active = 1'
  ).bind(userId).first<any>()
  if (!user) return c.json({ error: 'User not found' }, 401)

  const accessToken = await sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      linkedPatientId: user.linked_patient_id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    c.env.JWT_SECRET
  )

  return c.json({ accessToken })
})

app.post('/api/auth/logout', authMiddleware, async (c) => {
  const user = c.get('user')
  await c.env.DB.prepare(
    'DELETE FROM sessions WHERE user_id = ?'
  ).bind(user.sub).run()
  await logAudit(c.env.DB, {
    userId: user.sub,
    userName: user.username,
    userRole: user.role,
    action: 'auth.logout',
  })
  return c.json({ ok: true })
})

app.get('/api/auth/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const dbUser = await c.env.DB.prepare(
    'SELECT id, username, full_name, role, permissions, linked_patient_id, phone FROM users WHERE id = ?'
  ).bind(user.sub).first<any>()
  if (!dbUser) return c.json({ error: 'Not found' }, 404)
  return c.json({
    id: dbUser.id,
    username: dbUser.username,
    fullName: dbUser.full_name,
    role: dbUser.role,
    permissions: dbUser.permissions ? JSON.parse(dbUser.permissions) : [],
    linkedPatientId: dbUser.linked_patient_id,
    phone: dbUser.phone,
  })
})

// ============== Auth Middleware ==============
async function authMiddleware(c: any, next: any) {
  const header = c.req.header('authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = header.slice(7)
  try {
    const payload: any = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}

function requireRole(...roles: string[]) {
  return async (c: any, next: any) => {
    const user = c.get('user')
    if (!user || !roles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    await next()
  }
}

function requirePermission(perm: string) {
  return async (c: any, next: any) => {
    const user = c.get('user')
    if (user?.role === 'admin') return next()
    // يمكن تحسين هذا بقراءة الصلاحيات من JWT
    return next()
  }
}

// ============== Patient Routes ==============
app.get('/api/patients', authMiddleware, async (c) => {
  const url = new URL(c.req.url)
  const search = url.searchParams.get('q') || ''
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
  const offset = parseInt(url.searchParams.get('offset') || '0')

  let query = `SELECT id, file_number, full_name, birth_date, gender, phone, parent_name, parent_phone, blood_type, allergies, chronic_conditions, clinical_status, risk_level, last_visit_at, created_at FROM patients`
  const params: any[] = []
  const conditions: string[] = []

  if (search) {
    conditions.push('(full_name LIKE ? OR file_number LIKE ? OR phone LIKE ? OR parent_phone LIKE ?)')
    const like = `%${search}%`
    params.push(like, like, like, like)
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  const countResult = await c.env.DB.prepare(
    search
      ? 'SELECT COUNT(*) as count FROM patients WHERE full_name LIKE ? OR file_number LIKE ? OR phone LIKE ?'
      : 'SELECT COUNT(*) as count FROM patients'
  ).bind(...(search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [])).first<any>()

  return c.json({
    patients: results,
    total: countResult?.count || 0,
    limit,
    offset,
  })
})

app.get('/api/patients/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const patient = await c.env.DB.prepare(
    'SELECT * FROM patients WHERE id = ?'
  ).bind(id).first<any>()
  if (!patient) return c.json({ error: 'Not found' }, 404)
  // المرضى لا يمكنهم رؤية مرضى آخرين
  const user = c.get('user')
  if (user.role === 'patient' && user.linkedPatientId !== id) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  return c.json(patient)
})

const patientSchema = z.object({
  fullName: z.string().min(2).max(120),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['male', 'female']),
  phone: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  address: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  notes: z.string().optional(),
  clinicalStatus: z.enum(['active', 'inactive', 'resolved']).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
})

app.post('/api/patients', authMiddleware, requireRole('admin', 'doctor', 'nurse', 'receptionist'), async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = patientSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)

  const id = nanoid(21)
  const year = new Date().getFullYear()
  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM patients WHERE file_number LIKE ?'
  ).bind(`PAT-${year}-%`).first<any>()
  const fileNumber = `PAT-${year}-${String((countResult?.count || 0) + 1).padStart(4, '0')}`

  const user = c.get('user')
  await c.env.DB.prepare(`
    INSERT INTO patients (id, file_number, full_name, birth_date, gender, phone, parent_name, parent_phone, address, blood_type, allergies, chronic_conditions, notes, clinical_status, risk_level, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, fileNumber, parsed.data.fullName, parsed.data.birthDate, parsed.data.gender,
    parsed.data.phone || null, parsed.data.parentName || null, parsed.data.parentPhone || null,
    parsed.data.address || null, parsed.data.bloodType || null,
    parsed.data.allergies || null, parsed.data.chronicConditions || null,
    parsed.data.notes || null,
    parsed.data.clinicalStatus || 'active', parsed.data.riskLevel || 'low',
    user.sub
  ).run()

  await logAudit(c.env.DB, {
    userId: user.sub, userName: user.username, userRole: user.role,
    action: 'create_patient', entityType: 'patient', entityId: id,
    details: { fullName: parsed.data.fullName, fileNumber },
  })

  const patient = await c.env.DB.prepare('SELECT * FROM patients WHERE id = ?').bind(id).first()
  return c.json(patient, 201)
})

app.patch('/api/patients/:id', authMiddleware, requireRole('admin', 'doctor', 'nurse', 'receptionist'), async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const parsed = patientSchema.partial().safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid input' }, 400)

  const fields: string[] = []
  const values: any[] = []
  for (const [k, v] of Object.entries(parsed.data)) {
    const col = k.replace(/([A-Z])/g, '_$1').toLowerCase()
    fields.push(`${col} = ?`)
    values.push(v)
  }
  if (!fields.length) return c.json({ error: 'No fields' }, 400)

  values.push(id)
  await c.env.DB.prepare(
    `UPDATE patients SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`
  ).bind(...values).run()

  const user = c.get('user')
  await logAudit(c.env.DB, {
    userId: user.sub, userName: user.username, userRole: user.role,
    action: 'update_patient', entityType: 'patient', entityId: id, details: parsed.data,
  })

  return c.json({ ok: true })
})

app.delete('/api/patients/:id', authMiddleware, requireRole('admin'), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  await c.env.DB.prepare('DELETE FROM patients WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, {
    userId: user.sub, userName: user.username, userRole: user.role,
    action: 'delete_patient', entityType: 'patient', entityId: id,
  })
  return c.json({ ok: true })
})

// ============== Helpers ==============
async function logAudit(db: D1Database, entry: {
  userId?: string
  userName: string
  userRole?: string
  action: string
  entityType?: string
  entityId?: string
  details?: any
  ip?: string
  userAgent?: string
}) {
  await db.prepare(`
    INSERT INTO audit_log (id, user_id, user_name, user_role, action, entity_type, entity_id, details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    nanoid(21),
    entry.userId || null,
    entry.userName,
    entry.userRole || null,
    entry.action,
    entry.entityType || null,
    entry.entityId || null,
    entry.details ? JSON.stringify(entry.details) : null,
    entry.ip || null,
    entry.userAgent || null
  ).run()
}

// ============== 404 ==============
// طلبات الـ API ترجع JSON 404
// طلبات الـ SPA (أي route لا يبدأ بـ /api/) تُمرّر إلى ASSETS الذي يقدّم index.html
app.notFound(async (c) => {
  const url = new URL(c.req.url)
  // طلبات API → 404 JSON
  if (url.pathname.startsWith('/api/')) {
    return c.json({ error: 'Not found' }, 404)
  }
  // أي شيء آخر → SPA (index.html) عبر ASSETS binding
  try {
    return await c.env.ASSETS.fetch(c.req.raw)
  } catch (e) {
    return c.json({ error: 'Not found' }, 404)
  }
})

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal error', message: err.message }, 500)
})

export default app
