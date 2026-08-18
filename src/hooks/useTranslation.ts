import { useSettingsStore } from '@/stores/settingsStore'
import { translate, type Dict } from '@/lib/i18n'

export function useTranslation(): { t: Dict; lang: 'ar' | 'en' } {
  const lang = useSettingsStore((s) => s.language)
  return { t: translate(lang), lang }
}
