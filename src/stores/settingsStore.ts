import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Language, Theme } from '@/types'
import type { Currency } from '@/types/invoice'
import type { ClinicInfo } from '@/types/user'

interface SettingsState {
  clinic: ClinicInfo
  theme: Theme
  language: Language
  updateClinic: (data: Partial<ClinicInfo>) => void
  setTheme: (theme: Theme) => void
  setLanguage: (lang: Language) => void
  setCurrency: (c: Currency) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      clinic: {
        name: 'عيادة النور للأطفال',
        nameEn: 'Al-Noor Pediatric Clinic',
        logo: '',
        phone: '+963 11 555 1234',
        whatsapp: '+963 944 555 123',
        email: 'info@alnoor-clinic.sy',
        address: 'دمشق - المزة - شارع بغداد',
        addressEn: 'Damascus - Mezzeh - Baghdad St.',
        mapLink: 'https://maps.google.com/?q=33.5138,36.2765',
        workingHours: 'السبت - الخميس: 9:00 - 21:00',
        taxRate: 0,
        currency: 'SYP',
        signature: '',
        licenseNumber: 'SY-MED-2024-001',
        patientAppDownloadUrl: 'https://synapse-systems.app/download',
        patientAppName: 'سينابس - تطبيق المرضى',
        print: {
          paperSize: 'A4',
          showLogo: true,
          showSignature: true,
          showSynapseFooter: true,
          margins: 'normal',
          primaryColor: '#3b82f6',
          fontSize: 'md',
        },
      },
      theme: 'dark',
      language: 'ar',
      updateClinic: (data) =>
        set((s) => ({ clinic: { ...s.clinic, ...data } })),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) =>
        set((s) => ({ clinic: { ...s.clinic, currency } })),
    }),
    { name: 'synapse_settings', storage: createJSONStorage(() => localStorage) }
  )
)
