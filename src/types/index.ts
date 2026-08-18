export interface AuditLogEntry {
  id: string
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: string
  details?: Record<string, unknown>
  createdAt: string
}

export type Language = 'ar' | 'en'
export type Theme = 'light' | 'dark' | 'system'
