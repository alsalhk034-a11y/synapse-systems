import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Exam, ExamTemplate } from '@/types/exam'
import { seedExams, seedExamTemplates } from '@/data/seed'
import { generateId } from '@/lib/utils'

interface ExamsState {
  exams: Exam[]
  templates: ExamTemplate[]
  addExam: (data: Omit<Exam, 'id' | 'createdAt'>) => Exam
  updateExam: (id: string, data: Partial<Exam>) => void
  deleteExam: (id: string) => void
  getByPatient: (patientId: string) => Exam[]
  addTemplate: (data: Omit<ExamTemplate, 'id'>) => void
}

export const useExamsStore = create<ExamsState>()(
  persist(
    (set, get) => ({
      exams: seedExams,
      templates: seedExamTemplates,
      addExam: (data) => {
        const e: Exam = {
          id: generateId('exm'),
          createdAt: new Date().toISOString(),
          ...data,
        }
        set((s) => ({ exams: [e, ...s.exams] }))
        return e
      },
      updateExam: (id, data) =>
        set((s) => ({
          exams: s.exams.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
      deleteExam: (id) => set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),
      getByPatient: (patientId) =>
        get()
          .exams.filter((e) => e.patientId === patientId)
          .sort((a, b) => +new Date(b.examDate) - +new Date(a.examDate)),
      addTemplate: (data) =>
        set((s) => ({
          templates: [...s.templates, { ...data, id: generateId('tpl') }],
        })),
    }),
    { name: 'synapse_exams', storage: createJSONStorage(() => localStorage) }
  )
)
