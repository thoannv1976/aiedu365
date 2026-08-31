'use client'

import { useState } from 'react'

import { ErrorNotice, PageHeader, StatCard, useAdminData } from '@/components/admin/Panels'
import { adminGet, adminPatch, downloadLeadsCsv } from '@/lib/admin'

type Lead = {
  id: string
  fullName: string
  organization: string
  position: string
  email: string
  phone: string
  courses: { code: string; attendees: number }[]
  message: string
  source: string
  status: 'new' | 'contacted' | 'confirmed' | 'cancelled'
  _createdAt?: string
}

const STATUS_LABELS: Record<Lead['status'], string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
}

const STATUS_STYLES: Record<Lead['status'], string> = {
  new: 'border-brand-500 text-brand-700 dark:text-brand-300',
  contacted: 'border-amber-500 text-amber-700 dark:text-amber-400',
  confirmed: 'border-emerald-500 text-emerald-700 dark:text-emerald-400',
  cancelled: 'border-[rgb(var(--border))] muted',
}

export default function LeadsPage() {
  const [status, setStatus] = useState('')
  const [notice, setNotice] = useState('')
  const { data, error, loading, reload } = useAdminData<Lead[]>(
    () => adminGet(`/leads${status ? `?status=${status}` : ''}`),
    [status],
  )

  const changeStatus = async (id: string, next: Lead['status']) => {
    try {
      await adminPatch(`/leads/${id}`, { status: next })
      reload()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Không cập nhật được.')
    }
  }

  const exportCsv = async () => {
    try {
      await downloadLeadsCsv()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Không tải được file.')
    }
  }

  const leads = data ?? []
  const totalPeople = leads.reduce(
    (sum, l) => sum + (l.courses ?? []).reduce((s, c) => s + (c.attendees || 0), 0),
    0,
  )
  const byStatus = (s: Lead['status']) => leads.filter((l) => l.status === s).length

  return (
    <>
      <PageHeader
        title="Đăng ký"
        description="Danh sách đơn vị đã đăng ký. Xuất file CSV để mở bằng Excel — file có BOM nên tiếng Việt hiển thị đúng."
        actions={
          <button type="button" onClick={exportCsv} className="btn-primary !px-4 !py-2 text-xs">
            Xuất Excel/CSV
          </button>
        }
      />

      {notice && (
        <p className="mb-5 rounded-lg border-l-2 border-red-500 bg-red-50 p-3 text-sm dark:bg-red-900/20">
          {notice}
        </p>
      )}
      {error && <ErrorNotice error={error} />}

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Tổng đăng ký" value={leads.length} />
        <StatCard label="Tổng số người" value={totalPeople} />
        <StatCard label="Chưa liên hệ" value={byStatus('new')} tone={byStatus('new') > 0 ? 'warn' : 'default'} />
        <StatCard label="Đã xác nhận" value={byStatus('confirmed')} tone="good" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { value: '', label: 'Tất cả' },
          { value: 'new', label: 'Mới' },
          { value: 'contacted', label: 'Đã liên hệ' },
          { value: 'confirmed', label: 'Đã xác nhận' },
          { value: 'cancelled', label: 'Đã hủy' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatus(option.value)}
            className={`chip border-[rgb(var(--border))] ${status === option.value ? 'bg-ink-800 text-white' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 muted">Đang tải…</p>}
      {!loading && leads.length === 0 && <p className="mt-6 muted">Chưa có đăng ký nào.</p>}

      <div className="mt-6 space-y-3">
        {leads.map((lead) => (
          <article key={lead.id} className="card !p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{lead.organization}</p>
                <p className="text-sm muted">
                  {lead.fullName}
                  {lead.position ? ` · ${lead.position}` : ''}
                </p>
                <p className="mt-1 text-sm">
                  <a href={`mailto:${lead.email}`} className="text-brand-600 hover:underline dark:text-brand-400">
                    {lead.email}
                  </a>
                  {lead.phone && <span className="muted"> · {lead.phone}</span>}
                </p>
              </div>
              <span className={`chip text-[11px] ${STATUS_STYLES[lead.status]}`}>
                {STATUS_LABELS[lead.status]}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(lead.courses ?? []).map((c) => (
                <span key={c.code} className="chip border-[rgb(var(--border))] text-[11px]">
                  Khóa {c.code.replace('K', '')} · {c.attendees} người
                </span>
              ))}
              <span className="chip border-[rgb(var(--border))] text-[11px] muted">
                nguồn: {lead.source === 'chat' ? 'chatbot' : lead.source === 'wizard' ? 'chọn khóa' : 'form'}
              </span>
            </div>

            {lead.message && <p className="mt-3 text-sm muted">“{lead.message}”</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs muted">Chuyển trạng thái:</span>
              {(['new', 'contacted', 'confirmed', 'cancelled'] as const)
                .filter((s) => s !== lead.status)
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changeStatus(lead.id, s)}
                    className="chip border-[rgb(var(--border))] text-[11px] hover:border-brand-500"
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              {lead._createdAt && (
                <span className="ml-auto text-xs muted">
                  {new Date(lead._createdAt).toLocaleString('vi-VN')}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
