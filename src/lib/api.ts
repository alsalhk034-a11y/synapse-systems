/**
 * Synapse Systems - API Client
 * يستبدل localStorage بطلبات HTTP حقيقية إلى Worker
 */

const API_BASE = (import.meta.env?.VITE_API_URL as string) || '/api'

interface ApiOptions extends RequestInit {
  /** تخطي إضافة Authorization (مثلاً لـ login) */
  skipAuth?: boolean
  /** انتظار التوكن (لـ refresh) */
  retryOn401?: boolean
}

class TokenManager {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private refreshing: Promise<boolean> | null = null

  load() {
    this.accessToken = sessionStorage.getItem('synapse_access_token')
    this.refreshToken = sessionStorage.getItem('synapse_refresh_token')
  }

  save(access: string, refresh: string) {
    this.accessToken = access
    this.refreshToken = refresh
    sessionStorage.setItem('synapse_access_token', access)
    sessionStorage.setItem('synapse_refresh_token', refresh)
  }

  clear() {
    this.accessToken = null
    this.refreshToken = null
    sessionStorage.removeItem('synapse_access_token')
    sessionStorage.removeItem('synapse_refresh_token')
  }

  getAccess() { return this.accessToken }
  getRefresh() { return this.refreshToken }

  async refresh(userId: string): Promise<boolean> {
    if (this.refreshing) return this.refreshing
    this.refreshing = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken, userId }),
        })
        if (!res.ok) { this.clear(); return false }
        const data = await res.json()
        this.accessToken = data.accessToken
        sessionStorage.setItem('synapse_access_token', data.accessToken)
        return true
      } catch {
        this.clear()
        return false
      } finally {
        this.refreshing = null
      }
    })()
    return this.refreshing
  }
}

const tokens = new TokenManager()
tokens.load()

class ApiError extends Error {
  status: number
  data: any
  constructor(status: number, data: any, message?: string) {
    super(message || data?.error || 'API Error')
    this.status = status
    this.data = data
  }
}

async function request<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth, retryOn401 = true, ...init } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> || {}),
  }
  if (!skipAuth && tokens.getAccess()) {
    headers['Authorization'] = `Bearer ${tokens.getAccess()}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch (e: any) {
    throw new ApiError(0, null, `فشل الاتصال بالخادم: ${e.message}`)
  }

  // Auto-refresh on 401
  if (res.status === 401 && retryOn401 && !skipAuth) {
    const userId = sessionStorage.getItem('synapse_user_id')
    if (userId && tokens.getRefresh()) {
      const ok = await tokens.refresh(userId)
      if (ok) return request(path, { ...options, retryOn401: false })
    }
    // فشلت المصادقة - أعد التوجيه إلى login
    tokens.clear()
    sessionStorage.removeItem('synapse_user')
    sessionStorage.removeItem('synapse_user_id')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new ApiError(401, { error: 'انتهت الجلسة' }, 'انتهت الجلسة')
  }

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : await res.text()

  if (!res.ok) {
    throw new ApiError(res.status, data, data?.error || `HTTP ${res.status}`)
  }
  return data as T
}

// ============== Auth API ==============
export const auth = {
  async login(username: string, password: string) {
    const data = await request<{
      accessToken: string
      refreshToken: string
      user: any
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    })
    tokens.save(data.accessToken, data.refreshToken)
    sessionStorage.setItem('synapse_user', JSON.stringify(data.user))
    sessionStorage.setItem('synapse_user_id', data.user.id)
    return data.user
  },

  async logout() {
    try { await request('/auth/logout', { method: 'POST' }) } catch {}
    tokens.clear()
    sessionStorage.removeItem('synapse_user')
    sessionStorage.removeItem('synapse_user_id')
  },

  async me() {
    return request('/auth/me')
  },

  getCurrentUser(): any | null {
    const raw = sessionStorage.getItem('synapse_user')
    return raw ? JSON.parse(raw) : null
  },

  isAuthenticated() {
    return !!tokens.getAccess() && !!this.getCurrentUser()
  },
}

// ============== Patients API ==============
export const patientsApi = {
  list(params: { q?: string; limit?: number; offset?: number } = {}) {
    const search = new URLSearchParams()
    if (params.q) search.set('q', params.q)
    if (params.limit) search.set('limit', String(params.limit))
    if (params.offset) search.set('offset', String(params.offset))
    return request(`/patients?${search.toString()}`)
  },
  get(id: string) { return request(`/patients/${id}`) },
  create(data: any) { return request('/patients', { method: 'POST', body: JSON.stringify(data) }) },
  update(id: string, data: any) {
    return request(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },
  remove(id: string) { return request(`/patients/${id}`, { method: 'DELETE' }) },
}

// ============== Appointments API ==============
export const appointmentsApi = {
  list(params: { date?: string; doctorId?: string; patientId?: string } = {}) {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v && search.set(k, String(v)))
    return request(`/appointments?${search.toString()}`)
  },
  create(data: any) { return request('/appointments', { method: 'POST', body: JSON.stringify(data) }) },
  update(id: string, data: any) {
    return request(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },
  remove(id: string) { return request(`/appointments/${id}`, { method: 'DELETE' }) },
}

// ============== Exams API ==============
export const examsApi = {
  list(params: { patientId?: string; doctorId?: string; status?: string } = {}) {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v && search.set(k, String(v)))
    return request(`/exams?${search.toString()}`)
  },
  get(id: string) { return request(`/exams/${id}`) },
  create(data: any) { return request('/exams', { method: 'POST', body: JSON.stringify(data) }) },
  update(id: string, data: any) {
    return request(`/exams/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },
}

// ============== Invoices API ==============
export const invoicesApi = {
  list(params: { patientId?: string; status?: string } = {}) {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v && search.set(k, String(v)))
    return request(`/invoices?${search.toString()}`)
  },
  get(id: string) { return request(`/invoices/${id}`) },
  create(data: any) { return request('/invoices', { method: 'POST', body: JSON.stringify(data) }) },
  pay(id: string, payment: { amount: number; method: string; reference?: string }) {
    return request(`/invoices/${id}/pay`, { method: 'POST', body: JSON.stringify(payment) })
  },
}

// ============== Queue API ==============
export const queueApi = {
  list(params: { date?: string; doctorId?: string } = {}) {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v && search.set(k, String(v)))
    return request(`/queue?${search.toString()}`)
  },
  add(data: any) { return request('/queue', { method: 'POST', body: JSON.stringify(data) }) },
  update(id: string, data: any) {
    return request(`/queue/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },
  remove(id: string) { return request(`/queue/${id}`, { method: 'DELETE' }) },
}

// ============== Reports API ==============
export const reportsApi = {
  get(type: 'daily' | 'monthly' | 'patients' | 'revenue', params: Record<string, string> = {}) {
    const search = new URLSearchParams(params).toString()
    return request(`/reports/${type}?${search}`)
  },
}

// ============== File Upload ==============
export async function uploadFile(file: File, category: string, patientId: string): Promise<{ id: string; r2Key: string; url: string }> {
  // 1) اطلب signed upload URL من السيرفر
  const { uploadUrl, r2Key, id } = await request<{ uploadUrl: string; r2Key: string; id: string }>(
    '/files/upload',
    {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
        category,
        patientId,
      }),
    }
  )

  // 2) ارفع مباشرة إلى R2 عبر signed URL
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!res.ok) throw new Error('File upload failed')

  return { id, r2Key, url: uploadUrl.split('?')[0] }
}

export async function downloadFile(fileId: string): Promise<string> {
  const { url } = await request<{ url: string }>(`/files/${fileId}`)
  return url
}

export { ApiError }
export default {
  auth, patientsApi, appointmentsApi, examsApi, invoicesApi, queueApi, reportsApi,
  uploadFile, downloadFile, ApiError,
}
