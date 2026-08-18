import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserRole, Permission } from '@/types/user'
import { seedUsers } from '@/data/seed'
import { ROLE_DEFAULT_PERMISSIONS } from '@/types/permissions'
import { generateId } from '@/lib/utils'
import { generatePatientPassword, generatePatientUsername } from '@/stores/patientsStore'

interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  users: User[]
  login: (username: string, password: string) => boolean
  logout: () => void
  addUser: (user: User) => void
  updateUser: (id: string, data: Partial<User>) => void
  deleteUser: (id: string) => void
  hasRole: (...roles: UserRole[]) => boolean
  hasPermission: (perm: Permission) => boolean
  hasAnyPermission: (...perms: Permission[]) => boolean
  setUserPermissions: (id: string, perms: Permission[]) => void
  /**
   * إنشاء حساب مريض تلقائياً عند تسجيله من الطبيب
   * يعيد { user, generatedPassword } لإظهارها للطبيب/الممرضة وطباعتها في الفاتورة
   */
  createPatientAccount: (
    linkedPatientId: string,
    fullName: string,
    birthDate: string
  ) => { user: User; generatedPassword: string; alreadyExisted: boolean }
  /**
   * جلب حساب المريض المرتبط بمعرّف المريض (إن وُجد)
   */
  getPatientAccount: (linkedPatientId: string) => User | undefined
  /**
   * إعادة تعيين كلمة سر حساب المريض
   */
  resetPatientPassword: (linkedPatientId: string) => string | null
  /**
   * حذف جميع المرضى وبياناتهم مع الإبقاء على حسابات الطاقم الطبي
   * (admin / doctor / nurse / receptionist) — هذه ليست نسخة احتياطية بل حذف كامل
   */
  clearAllPatientData: () => {
    deletedUsers: number
    deletedPatients: number
  }
}

/** ضمان توافق كل مستخدم seed مع قائمة الصلاحيات الافتراضية لدوره */
function withDefaultPermissions(users: User[]): User[] {
  return users.map((u) => ({
    ...u,
    permissions:
      u.permissions && u.permissions.length > 0
        ? u.permissions
        : ROLE_DEFAULT_PERMISSIONS[u.role] || [],
  }))
}

const STAFF_ROLES: UserRole[] = ['admin', 'doctor', 'nurse', 'receptionist']

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      users: withDefaultPermissions(seedUsers),
      login: (username, password) => {
        const user = get().users.find(
          (u) => u.username === username && u.password === password && u.active
        )
        if (user) {
          const now = new Date().toISOString()
          const updated: User = { ...user, lastLoginAt: now }
          set((s) => ({
            currentUser: updated,
            isAuthenticated: true,
            users: s.users.map((u) => (u.id === user.id ? updated : u)),
          }))
          return true
        }
        return false
      },
      logout: () => set({ currentUser: null, isAuthenticated: false }),
      addUser: (user) =>
        set((s) => ({
          users: [
            ...s.users,
            {
              ...user,
              permissions:
                user.permissions && user.permissions.length > 0
                  ? user.permissions
                  : ROLE_DEFAULT_PERMISSIONS[user.role] || [],
            },
          ],
        })),
      updateUser: (id, data) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
          currentUser:
            s.currentUser && s.currentUser.id === id
              ? { ...s.currentUser, ...data }
              : s.currentUser,
        })),
      deleteUser: (id) =>
        set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
      hasRole: (...roles) => {
        const u = get().currentUser
        return u ? roles.includes(u.role) : false
      },
      hasPermission: (perm) => {
        const u = get().currentUser
        if (!u) return false
        return (u.permissions || []).includes(perm)
      },
      hasAnyPermission: (...perms) => {
        const u = get().currentUser
        if (!u) return false
        return perms.some((p) => (u.permissions || []).includes(p))
      },
      setUserPermissions: (id, perms) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, permissions: perms } : u)),
        })),

      // ===== Patient Account Auto-Creation =====
      createPatientAccount: (linkedPatientId, fullName, birthDate) => {
        const existing = get().users.find(
          (u) => u.linkedPatientId === linkedPatientId && u.role === 'patient'
        )
        if (existing) {
          return { user: existing, generatedPassword: existing.password, alreadyExisted: true }
        }
        const taken = new Set(
          get().users.map((u) => u.username).filter(Boolean) as string[]
        )
        const username = generatePatientUsername(fullName, birthDate, taken)
        const password = generatePatientPassword()
        const colors = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#06b6d4']
        const user: User = {
          id: generateId('usr'),
          username,
          password,
          fullName,
          role: 'patient',
          avatarColor: colors[Math.floor(Math.random() * colors.length)],
          permissions: ROLE_DEFAULT_PERMISSIONS.patient || [],
          linkedPatientId,
          active: true,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ users: [...s.users, user] }))
        return { user, generatedPassword: password, alreadyExisted: false }
      },

      getPatientAccount: (linkedPatientId) =>
        get().users.find((u) => u.linkedPatientId === linkedPatientId && u.role === 'patient'),

      resetPatientPassword: (linkedPatientId) => {
        const user = get().users.find(
          (u) => u.linkedPatientId === linkedPatientId && u.role === 'patient'
        )
        if (!user) return null
        const newPassword = generatePatientPassword()
        set((s) => ({
          users: s.users.map((u) => (u.id === user.id ? { ...u, password: newPassword } : u)),
        }))
        return newPassword
      },

      // ===== Clear All Patient Data (keeps staff only) =====
      clearAllPatientData: () => {
        const before = get().users
        const keptUsers = before.filter((u) => STAFF_ROLES.includes(u.role))
        const deletedUsers = before.length - keptUsers.length
        // المرضى سيُحذفون من المرضى أيضاً (يجب استدعاء patientsStore.deletePatient من المستدعي)
        set({ users: keptUsers, currentUser: null, isAuthenticated: false })
        // NOTE: patients count is reported by the caller because patientsStore is separate
        return { deletedUsers, deletedPatients: 0 }
      },
    }),
    {
      name: 'synapse_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        currentUser: s.currentUser,
        isAuthenticated: s.isAuthenticated,
        users: s.users,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.users) {
          state.users = withDefaultPermissions(state.users)
        }
      },
    }
  )
)
