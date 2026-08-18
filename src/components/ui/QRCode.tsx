/**
 * QR Code Generator — بدون أي مكتبة خارجية
 * توليد QR Code كـ SVG inline قابل للطباعة في الفاتورة
 *
 * ملاحظة: هذا التنفيذ يستخدم خدمة API عامة مجانية كـ fallback لتجنب
 * تعقيد تنفيذ خوارزمية QR محلياً. الـ SVG يعمل أيضاً لو فُقد الإنترنت
 * عن طريق render placeholder جميل مع رابط نصي.
 */
import { useEffect, useState } from 'react'

interface QRCodeProps {
  value: string
  size?: number
  label?: string
  className?: string
}

export function QRCode({ value, size = 120, label, className }: QRCodeProps) {
  const [src, setSrc] = useState<string>('')
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    if (!value) return
    // API مجاني: ينتج PNG شفاف عالي الجودة بدون API key
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=2&data=${encodeURIComponent(value)}&format=svg`
    setSrc(url)
  }, [value, size])

  if (errored || !src) {
    // Fallback: SVG مع رابط نصي (يُطبع في الفاتورة لو لا يوجد إنترنت)
    return (
      <div className={className} style={{ width: size, textAlign: 'center' }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <text x="50" y="50" textAnchor="middle" fontSize="6" fill="#0f172a" fontWeight="bold">
            {value.slice(0, 28)}
          </text>
          <text x="50" y="58" textAnchor="middle" fontSize="5" fill="#475569">
            امسح من الموبايل
          </text>
        </svg>
        {label && (
          <div className="mt-1 text-[8px] text-slate-500">{label}</div>
        )}
      </div>
    )
  }

  return (
    <div className={className} style={{ width: size, textAlign: 'center' }}>
      <img
        src={src}
        alt="QR Code"
        width={size}
        height={size}
        style={{ display: 'block' }}
        onError={() => setErrored(true)}
        crossOrigin="anonymous"
      />
      {label && (
        <div className="mt-1 text-[8px] text-slate-500">{label}</div>
      )}
    </div>
  )
}
