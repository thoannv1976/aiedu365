'use client'

import { useState } from 'react'

import { apiBase, courseName } from '@/lib/api'

/** Form thu thập thông tin liên hệ, hiện trong khung chat sau vài lượt trao đổi. */
export function LeadCapture({
  sessionId,
  courseContext,
  onDone,
  onDismiss,
}: {
  sessionId: string
  courseContext: string | null
  onDone: () => void
  onDismiss: () => void
}) {
  const [form, setForm] = useState({ fullName: '', organization: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch(`${apiBase}/api/leads`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'chat',
          sessionId,
          courses: courseContext ? [{ code: courseContext, attendees: 1 }] : [],
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      onDone()
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="rounded-xl border border-accent-300 bg-accent-50 p-4 dark:border-accent-700 dark:bg-accent-900/20">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">
          Anh/chị để lại thông tin để ban tổ chức liên hệ?
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng form liên hệ"
          className="text-sm muted"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 text-xs muted">
        {courseContext
          ? `Ban tổ chức sẽ tư vấn về ${courseName(courseContext)} và các đợt khai giảng sắp tới.`
          : 'Ban tổ chức sẽ tư vấn khóa phù hợp và thông tin các đợt khai giảng.'}
      </p>

      <form onSubmit={submit} className="mt-3 space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            required
            minLength={2}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Họ và tên"
            aria-label="Họ và tên"
            className="rounded-lg border bg-[rgb(var(--surface))] px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <input
            required
            minLength={2}
            value={form.organization}
            onChange={(e) => setForm({ ...form, organization: e.target.value })}
            placeholder="Đơn vị công tác"
            aria-label="Đơn vị công tác"
            className="rounded-lg border bg-[rgb(var(--surface))] px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            aria-label="Email"
            className="rounded-lg border bg-[rgb(var(--surface))] px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Điện thoại"
            aria-label="Điện thoại"
            className="rounded-lg border bg-[rgb(var(--surface))] px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        {status === 'error' && (
          <p className="text-xs text-red-600 dark:text-red-400">
            Chưa gửi được. Anh/chị thử lại hoặc dùng trang Đăng ký.
          </p>
        )}
        <button type="submit" disabled={status === 'sending'} className="btn-primary w-full !py-2 text-xs">
          {status === 'sending' ? 'Đang gửi…' : 'Gửi thông tin'}
        </button>
      </form>
    </div>
  )
}
