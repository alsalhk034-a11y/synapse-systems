import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuditLogEntry } from '@/types'
import { seedAuditLog } from '@/data/seed'
import { createAuditEntry } from '@/lib/audit'

interface AuditState {
  entries: AuditLogEntry[]
  log: (entry: Parameters<typeof createAuditEntry>[0]) => void
  clear: () => void
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      entries: seedAuditLog,
      log: (entry) =>
        set((s) => ({ entries: [createAuditEntry(entry), ...s.entries].slice(0, 500) })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'synapse_audit', storage: createJSONStorage(() => localStorage) }
  )
)
