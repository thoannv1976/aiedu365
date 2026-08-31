'use client'

import Link from 'next/link'
import { useState } from 'react'

import { apiBase, courseName } from '@/lib/api'
import type { CourseSummary } from '@/lib/types'

type Selection = Record<string, number>

export function RegistrationForm({
  courses,
  preselected,
}: {
  courses: CourseSummary[]
  preselected: string | null
}) {
  const [selection, setSelection] = useState<Selection>(
    preselected && courses.some((c) => c.code === preselected) ? { [preselected]: 3 } : {},
  )
  const [form, setForm] = useState({
    fullName: '',
    organization: '',
    position: '',
    email: '',
    phone: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  const toggle = (code: string) => {
    setSelection((prev) => {
      const next = { ...prev }
      if (code in next) delete next[code]
      else next[code] = 3
      return next
    })
  }

  const setAttendees = (code: string, value: number) => {
    setSelection((prev) => ({ ...prev, [code]: Math.max(1, Math.min(100, value)) }))
  }

  const selectedCodes = Object.keys(selection)
  const totalAttendees = Object.values(selection).reduce((a, b) => a + b, 0)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (selectedCodes.length === 0) {
      setError('Anh/chị vui lòng chọn ít nhất một khóa.')
      return
    }
    setError('')
    setStatus('sending')
    try {
      const res = await fetch(`${apiBase}/api/leads`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'form',
          courses: selectedCodes.map((code) => ({ code, attendees: selection[code] })),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? `HTTP ${res.status}`)
      }
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Không gửi được phiếu đăng ký.')
    }
  }

  if (status === 'done') {
    return (
      <div className="mt-10 rounded-xl border border-emerald-500 bg-emerald-50 p-8 text-center dark:bg-emerald-900/20">
        <p className="font-display text-xl font-bold">Đã ghi nhận đăng ký</p>
        <p className="mx-auto mt-3 max-w-prose text-sm muted">
          Cảm ơn anh/chị. Ban tổ chức sẽ liên hệ lại qua email{' '}
          <strong>{form.email}</strong> để xác nhận thời gian, địa điểm và các thông tin còn lại.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/khoa-hoc" className="btn-outline">
            Xem lại các khóa
          </Link>
          <Link href="/" className="btn-outline">
            Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-10">
      <fieldset>
        <legend className="font-display text-lg font-bold">1. Chọn khóa quan tâm</legend>
        <p className="mt-1 text-sm muted">
          Chọn một hoặc nhiều khóa, và ghi số người dự kiến cử cho từng khóa.
        </p>
        <div className="mt-5 space-y-2.5">
          {courses.map((course) => {
            const checked = course.code in selection
            return (
              <div
                key={course.code}
                className={`group-${course.group} card !p-4 ${checked ? 'border-brand-500' : ''}`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <input
                    type="checkbox"
                    id={`course-${course.code}`}
                    checked={checked}
                    onChange={() => toggle(course.code)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#0b3b75]"
                  />
                  <label htmlFor={`course-${course.code}`} className="min-w-0 flex-1 cursor-pointer">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="group-accent-bar rounded px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
                        {course.code}
                      </span>
                      <span className="text-sm font-semibold">{course.shortTitle}</span>
                    </span>
                    <span className="mt-1 block text-xs muted">
                      {course.duration} · khuyến nghị {course.headcount}
                    </span>
                  </label>
                  {checked && (
                    <span className="flex items-center gap-2">
                      <label htmlFor={`att-${course.code}`} className="text-xs muted">
                        Số người
                      </label>
                      <input
                        id={`att-${course.code}`}
                        type="number"
                        min={1}
                        max={100}
                        value={selection[course.code]}
                        onChange={(e) => setAttendees(course.code, Number(e.target.value))}
                        className="w-16 rounded-lg border bg-transparent px-2 py-1 text-sm outline-none focus:border-brand-500"
                      />
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {selectedCodes.length > 0 && (
          <p className="mt-4 text-sm">
            Đã chọn <strong>{selectedCodes.length}</strong> khóa (
            {selectedCodes.map((c) => courseName(c)).join(', ')}), tổng{' '}
            <strong>{totalAttendees}</strong> người.
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="font-display text-lg font-bold">2. Thông tin liên hệ</legend>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            { key: 'fullName' as const, label: 'Họ và tên', required: true, type: 'text' },
            { key: 'organization' as const, label: 'Đơn vị công tác', required: true, type: 'text' },
            { key: 'position' as const, label: 'Chức vụ', required: false, type: 'text' },
            { key: 'email' as const, label: 'Email', required: true, type: 'email' },
            { key: 'phone' as const, label: 'Điện thoại', required: false, type: 'tel' },
          ].map((field) => (
            <div key={field.key} className={field.key === 'organization' ? 'sm:col-span-2' : ''}>
              <label htmlFor={field.key} className="block text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              <input
                id={field.key}
                type={field.type}
                required={field.required}
                value={form[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="mt-1.5 w-full rounded-lg border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label htmlFor="message" className="block text-sm font-medium">
              Nhu cầu cụ thể của đơn vị
            </label>
            <textarea
              id="message"
              rows={4}
              maxLength={2000}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Ví dụ: trường đang chuẩn bị kiểm định AUN-QA, muốn xây Knowledge Base cho bộ minh chứng…"
              className="mt-1.5 w-full resize-y rounded-lg border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-lg border-l-2 border-red-500 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === 'sending'} className="btn-primary">
          {status === 'sending' ? 'Đang gửi…' : 'Gửi phiếu đăng ký'}
        </button>
        <p className="text-xs muted">
          Thông tin chỉ dùng để ban tổ chức liên hệ về chương trình tập huấn.
        </p>
      </div>
    </form>
  )
}
