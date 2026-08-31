'use client'

import { useEffect, useState } from 'react'

import { AdminApiError } from '@/lib/admin'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1.5 max-w-prose text-sm muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'good' | 'warn' | 'bad'
}) {
  const toneClass = {
    default: '',
    good: 'text-emerald-600 dark:text-emerald-400',
    warn: 'text-amber-600 dark:text-amber-400',
    bad: 'text-red-600 dark:text-red-400',
  }[tone]

  return (
    <div className="card !p-4">
      <p className="text-xs uppercase tracking-wide muted">{label}</p>
      <p className={`mt-1.5 font-display text-2xl font-bold tabular-nums ${toneClass}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs muted">{hint}</p>}
    </div>
  )
}

/** Thanh ngang so sánh tỷ trọng — đủ cho các bảng xếp hạng nhỏ, không cần thư viện biểu đồ. */
export function BarList({
  items,
  emptyText = 'Chưa có dữ liệu.',
}: {
  items: { label: string; value: number; hint?: string }[]
  emptyText?: string
}) {
  if (items.length === 0) return <p className="text-sm muted">{emptyText}</p>
  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 tabular-nums muted">{item.value}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[rgb(var(--border))]">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          {item.hint && <p className="mt-0.5 text-xs muted">{item.hint}</p>}
        </li>
      ))}
    </ul>
  )
}

export function ErrorNotice({ error }: { error: unknown }) {
  const isAuth = error instanceof AdminApiError && (error.status === 401 || error.status === 403)
  return (
    <div className="rounded-lg border-l-2 border-red-500 bg-red-50 p-4 text-sm dark:bg-red-900/20">
      <p className="font-medium text-red-700 dark:text-red-300">
        {error instanceof Error ? error.message : 'Đã xảy ra lỗi.'}
      </p>
      {isAuth && (
        <p className="mt-1.5 muted">
          Token không hợp lệ hoặc tài khoản chưa được cấp quyền. Đăng xuất rồi dán token mới.
        </p>
      )}
    </div>
  )
}

/** Nạp dữ liệu một lần khi mở trang, kèm trạng thái tải và lỗi. */
export function useAdminData<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    loader()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { data, error, loading, reload: () => setNonce((n) => n + 1) }
}
