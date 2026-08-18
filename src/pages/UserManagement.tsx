import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Edit, Trash2, Shield, Key, Power, PowerOff, Check } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/stores/toastStore'
import { PERMISSIONS_GROUPS, ALL_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from '@/types/permissions'
import { generateId } from '@/lib/utils'
import type { User, UserRole, Permission } from '@/types/user'
import { formatDate } from '@/lib/format'
import { useConfirm } from '@/components/notifications/Confirm'

const AVATAR_COLORS = [
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-cyan-600',
  'from-teal-500 to-emerald-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-fuchsia-500 to-purple-600',
  'from-lime-500 to-green-600',
  'from-sky-500 to-blue-600',
]

const ROLE_LABELS: Record<UserRole, { ar: string; en: string; color: string }> = {
  admin: { ar: 'مدير النظام', en: 'Admin', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40' },
  doctor: { ar: 'طبيب', en: 'Doctor', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40' },
  nurse: { ar: 'ممرض/ة', en: 'Nurse', color: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40' },
  receptionist: { ar: 'موظف استقبال', en: 'Receptionist', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40' },
  patient: { ar: 'مريض', en: 'Patient', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40' },
}

export function UserManagementPage() {
  const { t, lang } = useTranslation()
  const isAr = lang === 'ar'
  const confirm = useConfirm()
  const hasPerm = useAuthStore((s) => s.hasPermission)
  const users = useAuthStore((s) => s.users)
  const currentUser = useAuthStore((s) => s.currentUser)
  const addUser = useAuthStore((s) => s.addUser)
  const updateUser = useAuthStore((s) => s.updateUser)
  const deleteUser = useAuthStore((s) => s.deleteUser)
  const setUserPermissions = useAuthStore((s) => s.setUserPermissions)

  const [showAdd, setShowAdd] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [permUser, setPermUser] = useState<User | null>(null)

  if (!hasPerm('users.manage')) {
    return (
      <div className="surface mx-auto max-w-2xl p-8 text-center">
        <h2 className="text-xl font-bold">⛔ {isAr ? 'ليست لديك صلاحية' : 'No permission'}</h2>
        <p className="mt-2 text-sm text-[var(--text-3)]">
          {isAr ? 'هذه الصفحة لمدير النظام فقط.' : 'This page is for admins only.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Shield className="h-6 w-6 text-violet-500" />
            {t.userManagement}
          </h1>
          <p className="text-sm text-[var(--text-3)]">
            {isAr ? 'إدارة المستخدمين، الأدوار، والصلاحيات. يمكنك إعطاء صلاحيات كاملة أو جزئية.' : 'Manage users, roles, and permissions. Assign full or partial access.'}
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)} leftIcon={<Plus className="h-4 w-4" />}>
          {t.addUser}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => {
          const isMe = u.id === currentUser?.id
          const roleInfo = ROLE_LABELS[u.role]
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`surface relative overflow-hidden p-4 ${!u.active ? 'opacity-60' : ''}`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${u.avatarColor}`} />
              <div className="flex items-start gap-3">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${u.avatarColor} text-base font-bold text-white`}>
                  {u.fullName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-sm font-bold">{u.fullName}</h3>
                    {isMe && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">أنت</span>}
                  </div>
                  <div className="truncate text-[11px] text-[var(--text-3)]">@{u.username}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${roleInfo.color}`}>
                      {isAr ? roleInfo.ar : roleInfo.en}
                    </span>
                    {u.specialty && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800">{u.specialty}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-[11px] text-[var(--text-3)]">
                {u.email && <div className="flex items-center gap-1.5 truncate">📧 {u.email}</div>}
                {u.phone && <div>📞 {u.phone}</div>}
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {u.active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'موقوف' : 'Inactive')}
                </div>
                <div>
                  {u.lastLoginAt ? (isAr ? 'آخر دخول: ' : 'Last login: ') + formatDate(u.lastLoginAt) : (isAr ? 'لم يسجل دخول' : 'Never logged in')}
                </div>
                <div className="pt-1">
                  <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950/30">
                    {u.permissions.length} / {ALL_PERMISSIONS.length} {isAr ? 'صلاحية' : 'perms'}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => setPermUser(u)} leftIcon={<Key className="h-3 w-3" />}>
                  {t.permissions}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingUser(u)} leftIcon={<Edit className="h-3 w-3" />}>
                  {t.edit}
                </Button>
                {!isMe && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      updateUser(u.id, { active: !u.active })
                      toast.success(u.active ? (isAr ? 'تم إيقاف المستخدم' : 'User deactivated') : (isAr ? 'تم تفعيل المستخدم' : 'User activated'))
                    }}
                    leftIcon={u.active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                  >
                    {u.active ? (isAr ? 'إيقاف' : 'Disable') : (isAr ? 'تفعيل' : 'Enable')}
                  </Button>
                )}
                {!isMe && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const ok = await confirm({
                        title: isAr ? `حذف ${u.fullName}؟` : `Delete ${u.fullName}?`,
                        description: isAr
                          ? 'سيتم حذف حساب المستخدم نهائياً. لن يستطيع الدخول إلى النظام بعد الآن.'
                          : 'This will permanently delete the user account. They will no longer be able to sign in.',
                        confirmText: t.delete,
                        cancelText: t.cancel,
                        tone: 'danger',
                      })
                      if (ok) {
                        deleteUser(u.id)
                        toast.success(isAr ? 'تم الحذف' : 'Deleted')
                      }
                    }}
                    leftIcon={<Trash2 className="h-3 w-3 text-rose-500" />}
                  >
                    {t.delete}
                  </Button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {showAdd && (
        <AddEditUserModal
          onClose={() => setShowAdd(false)}
          onSave={(data) => {
            const newU: User = {
              ...data,
              id: generateId('user'),
              permissions: ROLE_DEFAULT_PERMISSIONS[data.role] || [],
              createdAt: new Date().toISOString(),
            }
            addUser(newU)
            toast.success(isAr ? 'تم إضافة المستخدم' : 'User added')
            setShowAdd(false)
          }}
        />
      )}

      {editingUser && (
        <AddEditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(data) => {
            updateUser(editingUser.id, data)
            toast.success(isAr ? 'تم التحديث' : 'Updated')
            setEditingUser(null)
          }}
        />
      )}

      {permUser && (
        <PermissionsModal
          user={permUser}
          onClose={() => setPermUser(null)}
          onSave={(perms) => {
            setUserPermissions(permUser.id, perms)
            toast.success(isAr ? 'تم تحديث الصلاحيات' : 'Permissions updated')
            setPermUser(null)
          }}
        />
      )}
    </div>
  )
}

function AddEditUserModal({ user, onClose, onSave }: { user?: User; onClose: () => void; onSave: (data: Partial<User>) => void }) {
  const { t, lang } = useTranslation()
  const isAr = lang === 'ar'
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [username, setUsername] = useState(user?.username || '')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [role, setRole] = useState<UserRole>(user?.role || 'receptionist')
  const [specialty, setSpecialty] = useState(user?.specialty || '')
  const [color, setColor] = useState(user?.avatarColor || AVATAR_COLORS[0])

  return (
    <Modal open onClose={onClose} title={user ? t.editUser : t.addUser} size="md">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{t.fullName}</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{t.username}</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{user ? t.newPassword : t.password}</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={user ? '••••••' : ''} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{t.role}</label>
            <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="admin">{ROLE_LABELS.admin.ar}</option>
              <option value="doctor">{ROLE_LABELS.doctor.ar}</option>
              <option value="nurse">{ROLE_LABELS.nurse.ar}</option>
              <option value="receptionist">{ROLE_LABELS.receptionist.ar}</option>
              <option value="patient">{ROLE_LABELS.patient.ar}</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{t.email}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{t.phone}</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {role === 'doctor' && (
            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{t.specialty}</label>
              <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="طب أطفال، أسنان..." />
            </div>
          )}
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{t.color}</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-lg bg-gradient-to-br ${c} transition-transform ${color === c ? 'ring-2 ring-blue-500 scale-110' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>{t.cancel}</Button>
        <Button
          onClick={() => {
            if (!fullName || !username) {
              toast.error(isAr ? 'الاسم واسم المستخدم مطلوبان' : 'Name and username required')
              return
            }
            const data: Partial<User> = {
              fullName, username, email, phone, role, specialty, avatarColor: color,
            }
            if (password) data.password = password
            onSave(data)
          }}
        >
          {t.save}
        </Button>
      </div>
    </Modal>
  )
}

function PermissionsModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (perms: Permission[]) => void }) {
  const { t, lang } = useTranslation()
  const isAr = lang === 'ar'
  const [perms, setPerms] = useState<Permission[]>(user.permissions || [])

  const toggle = (p: Permission) => {
    setPerms((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p])
  }
  const toggleGroup = (groupPerms: Permission[]) => {
    const all = groupPerms.every((p) => perms.includes(p))
    setPerms((cur) => all ? cur.filter((p) => !groupPerms.includes(p)) : Array.from(new Set([...cur, ...groupPerms])))
  }
  const enableAll = () => setPerms([...ALL_PERMISSIONS])
  const disableAll = () => setPerms([])
  const useDefault = () => setPerms(ROLE_DEFAULT_PERMISSIONS[user.role] || [])

  return (
    <Modal open onClose={onClose} size="xl" title={`${t.managePermissions} - ${user.fullName}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 p-2 text-[11px] dark:bg-blue-950/20">
        <Shield className="h-4 w-4 text-blue-500" />
        <span className="font-semibold">{t.fullAccess}: {ALL_PERMISSIONS.length}</span>
        <span>•</span>
        <span className="text-emerald-600">ممنوحة: {perms.length}</span>
        <span>•</span>
        <span className="text-rose-600">محجوبة: {ALL_PERMISSIONS.length - perms.length}</span>
        <div className="ms-auto flex gap-1.5">
          <Button size="sm" variant="ghost" onClick={useDefault}>{isAr ? 'الافتراضي' : 'Default'}</Button>
          <Button size="sm" variant="ghost" onClick={disableAll}>{isAr ? 'إلغاء الكل' : 'Clear'}</Button>
          <Button size="sm" variant="primary" onClick={enableAll}>{isAr ? 'كامل الصلاحيات' : 'Full Access'}</Button>
        </div>
      </div>
      <div className="space-y-2">
        {PERMISSIONS_GROUPS.map((g) => {
          const groupPerms = g.perms.map((p) => p.key)
          const enabledCount = g.perms.filter((p) => perms.includes(p.key)).length
          const allOn = enabledCount === g.perms.length
          return (
            <div key={g.key} className="rounded-xl border border-[var(--border)]">
              <div className="flex items-center justify-between bg-[var(--bg-2)]/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{isAr ? g.titleAr : g.titleEn}</span>
                  <span className="text-[10px] text-[var(--text-3)]">{enabledCount}/{g.perms.length}</span>
                </div>
                <button onClick={() => toggleGroup(groupPerms)} className="text-[10px] font-semibold text-blue-500 hover:underline">
                  {allOn ? (isAr ? 'إلغاء الكل' : 'Clear') : (isAr ? 'تفعيل الكل' : 'Enable all')}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1 p-2 sm:grid-cols-2">
                {g.perms.map((p) => {
                  const on = perms.includes(p.key)
                  return (
                    <button
                      key={p.key}
                      onClick={() => toggle(p.key)}
                      className={`flex items-center gap-2 rounded-md border p-1.5 text-start text-[11px] transition-all ${
                        on ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'border-[var(--border)] hover:border-[var(--text-3)]'
                      }`}
                    >
                      <div className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-[var(--border-strong)]'}`}>
                        {on && <Check className="h-2.5 w-2.5" />}
                      </div>
                      <span className="font-semibold">{isAr ? p.ar : p.en}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>{t.cancel}</Button>
        <Button variant="primary" onClick={() => onSave(perms)}>{t.save}</Button>
      </div>
    </Modal>
  )
}
