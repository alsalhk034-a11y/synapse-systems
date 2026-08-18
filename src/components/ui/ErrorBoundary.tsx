import { Component, type ReactNode, type ErrorInfo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, Copy, ChevronDown } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { useState } from 'react'

interface Props {
  children: ReactNode
  /** عرض خفيف (للنوافذ/البطاقات) أم عرض كامل (للصفحات) */
  variant?: 'page' | 'component'
  /** اسم القسم الذي يحميه */
  scope?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary لالتقاط أخطاء وقت التشغيل ومنع انهيار التطبيق بالكامل.
 * - variant="page": للصفحات (Shell Layout)
 * - variant="component": للنوافذ والبطاقات (يعرض fallback صغير)
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.scope ? ':' + this.props.scope : ''}]`, error, errorInfo)
    this.setState({ errorInfo })
    // في الإنتاج: يمكن إرسال الخطأ إلى Sentry أو Backend
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleHome = () => {
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.variant === 'component') {
      return (
        <Card padding="md" className="border-rose-500/30 bg-rose-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                حدث خطأ في هذا القسم
              </h4>
              <p className="mt-1 text-xs text-[var(--text-2)]">
                {this.state.error?.message || 'خطأ غير متوقع'}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={this.handleReset}
                className="mt-2"
                leftIcon={<RefreshCw className="h-3 w-3" />}
              >
                إعادة المحاولة
              </Button>
            </div>
          </div>
        </Card>
      )
    }

    return <ErrorFallback
      error={this.state.error}
      errorInfo={this.state.errorInfo}
      onReset={this.handleReset}
      onReload={this.handleReload}
      onHome={this.handleHome}
      scope={this.props.scope}
    />
  }
}

function ErrorFallback({
  error,
  errorInfo,
  onReset,
  onReload,
  onHome,
  scope,
}: {
  error: Error | null
  errorInfo: ErrorInfo | null
  onReset: () => void
  onReload: () => void
  onHome: () => void
  scope?: string
}) {
  const [showStack, setShowStack] = useState(false)
  const [copied, setCopied] = useState(false)

  const errorMessage = error?.message || 'خطأ غير معروف'
  const errorStack = error?.stack || ''
  const componentStack = errorInfo?.componentStack || ''

  const fullReport = JSON.stringify(
    { message: errorMessage, stack: errorStack, componentStack, scope },
    null,
    2
  )

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(fullReport)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // في حالة فشل clipboard
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <Card padding="lg" className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-20 -end-20 h-60 w-60 rounded-full bg-gradient-to-br from-rose-500/15 to-amber-500/15 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/15">
                <AlertTriangle className="h-6 w-6 text-rose-500" strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-lg font-bold">حدث خطأ غير متوقع</h2>
                <p className="mt-0.5 text-xs text-[var(--text-2)]">
                  {scope ? `القسم: ${scope}` : 'صفحة Synapse Systems'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {errorMessage}
              </div>
            </div>

            <button
              onClick={() => setShowStack(!showStack)}
              className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-2)] hover:text-[var(--text)]"
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showStack ? 'rotate-180' : ''}`}
              />
              {showStack ? 'إخفاء التفاصيل' : 'عرض التفاصيل الفنية'}
            </button>

            {showStack && (
              <motion.pre
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 max-h-64 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-3 text-[10px] leading-relaxed text-[var(--text-2)]"
                dir="ltr"
              >
                {errorStack}
                {componentStack && `\n\n--- Component Stack ---\n${componentStack}`}
              </motion.pre>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={onReset}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                إعادة المحاولة
              </Button>
              <Button variant="secondary" onClick={onHome} leftIcon={<Home className="h-4 w-4" />}>
                الرئيسية
              </Button>
              <Button variant="ghost" onClick={onReload}>
                تحديث الصفحة
              </Button>
              <Button
                variant="ghost"
                onClick={copyReport}
                leftIcon={<Copy className="h-4 w-4" />}
              >
                {copied ? 'تم النسخ' : 'نسخ التقرير'}
              </Button>
            </div>

            <p className="mt-4 text-[10px] text-[var(--text-3)]">
              إذا استمرت المشكلة، يُرجى التواصل مع الدعم الفني وإرسال تقرير الخطأ.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
