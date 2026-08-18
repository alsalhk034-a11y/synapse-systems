/**
 * Hooks مساعدة للأداء:
 * - usePagination: pagination للحوايات الطويلة (مرضى، فواتير...)
 * - useDebouncedValue: debounce للبحث الفوري
 */

import { useMemo, useState, useEffect } from 'react'

/**
 * هوك pagination بسيط يعتمد على الـ page index.
 * الاستخدام:
 *   const { page, setPage, totalPages, pagedItems, total } = usePagination(filtered, 20)
 */
export function usePagination<T>(items: T[], pageSize: number = 20) {
  const [page, setPage] = useState(1)

  // إعادة الضبط إلى الصفحة الأولى عند تغير العناصر (مثلاً تغيير الفلتر)
  useEffect(() => {
    setPage(1)
  }, [items.length])

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // ضمان أن الـ page لا تتجاوز العدد الفعلي بعد حذف عناصر
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  return {
    page,
    setPage,
    totalPages,
    total,
    pageSize,
    pagedItems,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}
