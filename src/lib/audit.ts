import { generateId } from './utils'
import type { AuditLogEntry } from '@/types'

export function createAuditEntry(params: {
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: string
  details?: Record<string, unknown>
}): AuditLogEntry {
  return {
    id: generateId('audit'),
    createdAt: new Date().toISOString(),
    ...params,
  }
}
