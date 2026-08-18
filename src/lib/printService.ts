/**
 * نظام طباعة متقدم يستخدم iframe معزول
 * يطبع محتوى المستند فقط دون أي شيء آخر على الصفحة
 * مبني على أفضل الممارسات العالمية للطباعة في المتصفحات
 */

import type { PrintSettings } from '@/types/user'

interface PrintOptions {
  /** محتوى HTML للطباعة */
  content: string
  /** اسم المستند (يظهر كعنوان نافذة الطباعة) */
  documentTitle?: string
  /** حجم الورق */
  paperSize?: 'A4' | 'A5'
  /** الاتجاه */
  orientation?: 'portrait' | 'landscape'
  /** الهوامش */
  margins?: 'normal' | 'narrow' | 'wide' | 'none'
  /** حجم الخط */
  fontSize?: 'sm' | 'md' | 'lg'
  /** اللون الأساسي */
  primaryColor?: string
  /** اللغة: ar, en, both */
  language?: 'ar' | 'en' | 'both'
  /** اتجاه النص */
  direction?: 'rtl' | 'ltr'
  /** CSS إضافي */
  extraCss?: string
}

const MARGIN_MAP: Record<string, string> = {
  narrow: '8mm',
  normal: '15mm',
  wide: '25mm',
  none: '0',
}

const FONT_SIZE_MAP: Record<string, string> = {
  sm: '11px',
  md: '13px',
  lg: '15px',
}

const PAPER_SIZE_MAP: Record<string, { width: string; height: string }> = {
  A4: { width: '210mm', height: '297mm' },
  A5: { width: '148mm', height: '210mm' },
}

function buildPrintDocument(opts: PrintOptions & { paperSize: 'A4' | 'A5'; orientation: 'portrait' | 'landscape' }): string {
  const paper = PAPER_SIZE_MAP[opts.paperSize] || PAPER_SIZE_MAP.A4
  const isLandscape = opts.orientation === 'landscape'
  const paperW = isLandscape ? paper.height : paper.width
  const paperH = isLandscape ? paper.width : paper.height
  const margin = MARGIN_MAP[opts.margins || 'normal']
  const fontSize = FONT_SIZE_MAP[opts.fontSize || 'md']
  const dir = opts.direction || 'rtl'
  const lang = opts.language || 'ar'

  return `<!DOCTYPE html>
<html lang="${lang === 'ar' ? 'ar' : lang === 'en' ? 'en' : 'ar'}" dir="${dir}">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(opts.documentTitle || 'Print')}</title>
<style>
  @page {
    size: ${opts.paperSize} ${opts.orientation};
    margin: ${margin};
  }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { margin: 0; padding: 0; background: white; color: #0f172a; font-family: 'IBM Plex Sans Arabic','Inter','Segoe UI',Tahoma,Arial,sans-serif; font-size: ${fontSize}; line-height: 1.5; }
  body { padding: ${margin}; }
  ${opts.extraCss || ''}
</style>
</head>
<body>
${opts.content}
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * يطبع محتوى HTML داخل iframe معزول - الحل الأمثل للطباعة الجزئية
 */
export function printHTML(options: PrintOptions): void {
  const paperSize = options.paperSize || 'A4'
  const orientation = options.orientation || 'portrait'
  const html = buildPrintDocument({ ...options, paperSize, orientation })

  const iframe = document.createElement('iframe')
  iframe.name = 'print-iframe-' + Date.now()
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.setAttribute('aria-hidden', 'true')
  iframe.setAttribute('tabindex', '-1')
  document.body.appendChild(iframe)

  const cleanup = () => {
    try {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    } catch {}
  }

  iframe.onload = () => {
    try {
      const win = iframe.contentWindow
      if (!win) {
        cleanup()
        return
      }
      // انتظر تحميل الخطوط والصور
      const trigger = () => {
        try {
          win.focus()
          win.print()
        } catch (e) {
          console.error('Print failed', e)
        } finally {
          setTimeout(cleanup, 500)
        }
      }
      // محاولة انتظار اكتمال التحميل
      if (win.document.readyState === 'complete') {
        setTimeout(trigger, 150)
      } else {
        win.addEventListener('load', () => setTimeout(trigger, 150), { once: true })
      }
    } catch (e) {
      console.error(e)
      cleanup()
    }
  }

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    cleanup()
    return
  }
  doc.open()
  doc.write(html)
  doc.close()
}

/**
 * يطبع عنصر DOM مباشرة عن طريق استنساخه إلى iframe
 */
export function printElement(element: HTMLElement, options: Omit<PrintOptions, 'content'>): void {
  const clone = element.cloneNode(true) as HTMLElement
  printHTML({ ...options, content: clone.outerHTML })
}

export function buildPrintCss(settings: PrintSettings, extraCss = ''): string {
  const margin = MARGIN_MAP[settings.margins] || MARGIN_MAP.normal
  const fontSize = FONT_SIZE_MAP[settings.fontSize] || FONT_SIZE_MAP.md
  return `
    @page { size: ${settings.paperSize}; margin: ${margin}; }
    @media print {
      html, body { margin: 0; padding: 0; background: white !important; }
      body { font-size: ${fontSize}; }
    }
    ${extraCss}
  `
}
