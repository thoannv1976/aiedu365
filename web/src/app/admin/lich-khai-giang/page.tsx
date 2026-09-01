'use client'

import { useState } from 'react'

import { Field, TextArea } from '@/components/admin/SaveBar'
import { ErrorNotice, PageHeader, useAdminData } from '@/components/admin/Panels'
import { adminDelete, adminGet, adminPost, adminPut } from '@/lib/admin'
import { courseName, formatDate, formatDateRange } from '@/lib/api'

type Schedule = {
  id: string
  courseCode: string
  startDate: string
  endDate: string
  location: string
  format: string
  registrationDeadline: string
  capacity: number | string
  contactName: string
  contactEmail: string
  contactPhone: string
  status: string
  note: string
}

const COURSES = ['K21', 'K22', 'K23', 'K24', 'K25', 'K26', 'K27', 'K28']

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Dự kiến' },
  { value: 'open', label: 'Đang nhận đăng ký' },
  { value: 'closed', label: 'Đã đóng đăng ký' },
  { value: 'done', label: 'Đã tổ chức' },
  { value: 'cancelled', label: 'Đã hủy (ẩn khỏi trang công khai)' },
]

const EMPTY: Omit<Schedule, 'id'> = {
  courseCode: 'K21',
  startDate: '',
  endDate: '',
  location: '',
  format: 'Trực tiếp, kết hợp workshop',
  registrationDeadline: '',
  capacity: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  status: 'planned',
  note: '',
}

function ScheduleForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: Omit<Schedule, 'id'>
  onSubmit: (value: Omit<Schedule, 'id'>) => void
  onCancel: () => void
  submitLabel: string
}) {
  const [form, setForm] = useState(initial)

  return (
    <div className="card border-brand-500">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="s-course" className="block text-sm font-medium">
            Khóa
          </label>
          <select
            id="s-course"
            value={form.courseCode}
            onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
            className="mt-1.5 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {COURSES.map((code) => (
              <option key={code} value={code}>
                {courseName(code)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="s-status" className="block text-sm font-medium">
            Trạng thái
          </label>
          <select
            id="s-status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1.5 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <Field label="Ngày bắt đầu" type="date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
        <Field label="Ngày kết thúc" type="date" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
        <Field label="Địa điểm" value={form.location} onChange={(v) => setForm({ ...form, location: v })} className="sm:col-span-2" />
        <Field label="Hình thức" value={form.format} onChange={(v) => setForm({ ...form, format: v })} />
        <Field label="Hạn đăng ký" type="date" value={form.registrationDeadline} onChange={(v) => setForm({ ...form, registrationDeadline: v })} />
        <Field label="Số chỗ" type="number" value={String(form.capacity ?? '')} onChange={(v) => setForm({ ...form, capacity: v })} />
        <Field label="Người phụ trách" value={form.contactName} onChange={(v) => setForm({ ...form, contactName: v })} />
        <Field label="Email đầu mối" type="email" value={form.contactEmail} onChange={(v) => setForm({ ...form, contactEmail: v })} />
        <Field label="Điện thoại đầu mối" value={form.contactPhone} onChange={(v) => setForm({ ...form, contactPhone: v })} />
        <TextArea label="Ghi chú" rows={2} value={form.note} onChange={(v) => setForm({ ...form, note: v })} className="sm:col-span-2" />
      </div>

      <div className="mt-5 flex gap-2">
        <button type="button" onClick={() => onSubmit(form)} className="btn-primary !px-4 !py-2 text-sm">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline !px-4 !py-2 text-sm">
          Hủy
        </button>
      </div>
    </div>
  )
}

export default function SchedulePage() {
  const { data, error, loading, reload } = useAdminData<Schedule[]>(() => adminGet('/schedules'))
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const run = async (action: () => Promise<{ message?: string }>) => {
    try {
      const res = await action()
      setNotice(res.message ?? 'Đã lưu.')
      setCreating(false)
      setEditing(null)
      reload()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Thao tác thất bại.')
    }
  }

  const rows = data ?? []

  return (
    <>
      <PageHeader
        title="Lịch khai giảng"
        description="Thời gian, địa điểm và đầu mối của từng đợt. Đây là những thông tin thư mời để trống — nhập xong là trang công khai và chatbot dùng được ngay."
        actions={
          !creating && (
            <button type="button" onClick={() => setCreating(true)} className="btn-primary !px-4 !py-2 text-xs">
              Thêm đợt khai giảng
            </button>
          )
        }
      />

      {notice && (
        <p className="mb-5 rounded-lg border-l-2 border-emerald-500 bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">
          {notice}
        </p>
      )}
      {error && <ErrorNotice error={error} />}

      {creating && (
        <div className="mb-6">
          <ScheduleForm
            initial={EMPTY}
            submitLabel="Thêm đợt"
            onCancel={() => setCreating(false)}
            onSubmit={(value) => run(() => adminPost('/schedules', value))}
          />
        </div>
      )}

      {loading && <p className="muted">Đang tải…</p>}
      {!loading && rows.length === 0 && !creating && (
        <p className="rounded-lg border-l-2 border-amber-500 bg-amber-50 p-4 text-sm dark:bg-amber-900/20">
          Chưa có đợt khai giảng nào. Khi được hỏi “khi nào khai giảng”, chatbot trả lời rằng ban
          tổ chức sẽ thông báo — đúng, nhưng thêm lịch vào đây thì nó trả lời được cụ thể.
        </p>
      )}

      <div className="space-y-3">
        {rows.map((row) =>
          editing === row.id ? (
            <ScheduleForm
              key={row.id}
              initial={row}
              submitLabel="Lưu thay đổi"
              onCancel={() => setEditing(null)}
              onSubmit={(value) => run(() => adminPut(`/schedules/${row.id}`, value))}
            />
          ) : (
            <article key={row.id} className="card !p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {courseName(row.courseCode)}
                    {row.location ? ` · ${row.location}` : ''}
                  </p>
                  <p className="mt-1 text-sm muted">
                    {formatDateRange(row.startDate, row.endDate) || 'chưa có ngày'}
                    {row.capacity ? ` · ${row.capacity} chỗ` : ''}
                    {row.registrationDeadline
                      ? ` · hạn đăng ký ${formatDate(row.registrationDeadline)}`
                      : ''}
                  </p>
                  {(row.contactName || row.contactEmail) && (
                    <p className="mt-1 text-sm muted">
                      Đầu mối: {row.contactName} {row.contactEmail && `· ${row.contactEmail}`}{' '}
                      {row.contactPhone && `· ${row.contactPhone}`}
                    </p>
                  )}
                </div>
                <span className="chip border-[rgb(var(--border))] text-[11px] muted">
                  {STATUS_OPTIONS.find((o) => o.value === row.status)?.label ?? row.status}
                </span>
              </div>
              <div className="mt-3 flex gap-3 text-xs">
                <button type="button" onClick={() => setEditing(row.id)} className="text-brand-600 hover:underline dark:text-brand-400">
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Xóa đợt khai giảng này?')) run(() => adminDelete(`/schedules/${row.id}`))
                  }}
                  className="text-red-600 hover:underline dark:text-red-400"
                >
                  Xóa
                </button>
              </div>
            </article>
          ),
        )}
      </div>
    </>
  )
}
