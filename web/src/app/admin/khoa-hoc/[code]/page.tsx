'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ErrorNotice, PageHeader, useAdminData } from '@/components/admin/Panels'
import { Field, LineList, SaveBar, TextArea } from '@/components/admin/SaveBar'
import { adminGet, adminPatch } from '@/lib/admin'
import { courseName } from '@/lib/api'
import type { Course } from '@/lib/types'

/** Các trường máy chủ cho phép sửa; gửi thừa sẽ bị bỏ qua kèm cảnh báo. */
const EDITABLE = [
  'title', 'shortTitle', 'tagline', 'duration', 'durationDays', 'method',
  'outputSummary', 'aliases', 'recipients', 'intro', 'coreGoal', 'highlight',
  'objectives', 'values', 'audience', 'days', 'deliverables', 'software',
  'kpis', 'dataToBring', 'roadmap', 'longTermGoal', 'motto', 'responsibleAi',
  'relatedCourses', 'order', 'featured', 'published',
] as const

type Tab = 'chung' | 'noi-dung' | 'ket-qua' | 'phan-mem' | 'nguyen-tac'

const TABS: { id: Tab; label: string }[] = [
  { id: 'chung', label: 'Thông tin chung' },
  { id: 'noi-dung', label: 'Nội dung từng ngày' },
  { id: 'ket-qua', label: 'Kết quả & KPI' },
  { id: 'phan-mem', label: 'Phần mềm' },
  { id: 'nguyen-tac', label: 'Nguyên tắc & đối tượng' },
]

export default function CourseEditorPage() {
  const params = useParams<{ code: string }>()
  const code = (params?.code ?? '').toUpperCase()

  const { data, error, loading, reload } = useAdminData<Course>(
    () => adminGet(`/courses/${code}`),
    [code],
  )
  const [form, setForm] = useState<Course | null>(null)
  const [tab, setTab] = useState<Tab>('chung')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (data) setForm(structuredClone(data))
  }, [data])

  if (error) return <ErrorNotice error={error} />
  if (loading || !form || !data) return <p className="muted">Đang tải…</p>

  const dirty = JSON.stringify(form) !== JSON.stringify(data)
  const set = (patch: Partial<Course>) => setForm({ ...form, ...patch })

  const save = async () => {
    setSaving(true)
    try {
      const payload = Object.fromEntries(
        EDITABLE.map((key) => [key, form[key as keyof Course]]),
      )
      const res = await adminPatch<{ message: string }>(`/courses/${code}`, payload)
      setNotice(res.message)
      reload()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Không lưu được.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title={`${courseName(form.code)} — ${form.shortTitle}`}
        description={`Khóa tập huấn chuyên sâu số ${form.legacyNumber} trong thư mời · ${form.slug}`}
        actions={
          <>
            <Link href={`/khoa-hoc/${form.slug}`} target="_blank" className="btn-outline !px-4 !py-2 text-xs">
              Xem trang công khai
            </Link>
            <Link href="/admin/khoa-hoc" className="btn-outline !px-4 !py-2 text-xs">
              ← Danh sách
            </Link>
          </>
        }
      />

      <nav className="mb-6 flex flex-wrap gap-1.5" aria-label="Phần nội dung">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'true' : undefined}
            className={`chip border-[rgb(var(--border))] ${tab === t.id ? 'bg-ink-800 text-white' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'chung' && (
        <div className="space-y-6">
          <section className="card">
            <h2 className="font-display text-lg font-bold">Tiêu đề và mô tả</h2>
            <div className="mt-4 grid gap-4">
              <Field label="Tên đầy đủ" value={form.title} onChange={(v) => set({ title: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tên ngắn" hint="Hiện trên thẻ khóa học." value={form.shortTitle} onChange={(v) => set({ shortTitle: v })} />
                <Field label="Chủ đề" hint="Dòng tiếng Anh dưới tiêu đề." value={form.tagline} onChange={(v) => set({ tagline: v })} />
                <Field label="Thời lượng" value={form.duration} onChange={(v) => set({ duration: v })} />
                <Field
                  label="Số ngày"
                  type="number"
                  hint="Dùng để tính tổng số ngày trên trang chủ."
                  value={String(form.durationDays)}
                  onChange={(v) => set({ durationDays: Number(v) || 0 })}
                />
                <Field label="Phương pháp" value={form.method} onChange={(v) => set({ method: v })} />
                <Field label="Đầu ra tóm tắt" value={form.outputSummary} onChange={(v) => set({ outputSummary: v })} />
              </div>
              <TextArea label="Kính gửi" rows={2} value={form.recipients} onChange={(v) => set({ recipients: v })} />
              <LineList
                label="Đoạn mở đầu"
                hint="Mỗi dòng là một đoạn văn."
                rows={8}
                value={form.intro}
                onChange={(v) => set({ intro: v })}
              />
              <TextArea label="Mục tiêu cốt lõi" rows={3} value={form.coreGoal} onChange={(v) => set({ coreGoal: v })} />
            </div>
          </section>

          <section className="card">
            <h2 className="font-display text-lg font-bold">Từ khóa nhận diện</h2>
            <p className="mt-1 text-sm muted">
              Chatbot dùng những từ này để hiểu người hỏi đang nói về khóa nào, kể cả khi họ không
              nêu mã. Thêm cách gọi mà các trường hay dùng.
            </p>
            <div className="mt-4">
              <LineList label="Từ khóa" hint="Mỗi dòng một từ khóa." rows={8} value={form.aliases} onChange={(v) => set({ aliases: v })} />
            </div>
          </section>

          <section className="card">
            <h2 className="font-display text-lg font-bold">Hiển thị</h2>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.published} onChange={(e) => set({ published: e.target.checked })} className="h-4 w-4 accent-[#0b3b75]" />
                Hiển thị công khai
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} className="h-4 w-4 accent-[#0b3b75]" />
                Nổi bật (chiếm trọn hàng trong lưới)
              </label>
              <Field label="Thứ tự" type="number" value={String(form.order)} onChange={(v) => set({ order: Number(v) || 0 })} />
            </div>
          </section>
        </div>
      )}

      {tab === 'noi-dung' && (
        <div className="space-y-4">
          {form.days.map((day, i) => (
            <section key={day.no} className="card">
              <h2 className="font-display text-lg font-bold">Ngày {day.no}</h2>
              <div className="mt-4 grid gap-4">
                <Field
                  label="Tiêu đề"
                  value={day.title}
                  onChange={(v) => {
                    const days = [...form.days]
                    days[i] = { ...day, title: v }
                    set({ days })
                  }}
                />
                <Field
                  label="Mô tả ngắn"
                  value={day.subtitle}
                  onChange={(v) => {
                    const days = [...form.days]
                    days[i] = { ...day, subtitle: v }
                    set({ days })
                  }}
                />
                <LineList
                  label="Nội dung"
                  rows={10}
                  value={day.topics}
                  onChange={(v) => {
                    const days = [...form.days]
                    days[i] = { ...day, topics: v }
                    set({ days })
                  }}
                />
                <TextArea
                  label="Kết quả đầu ra của ngày"
                  rows={2}
                  value={day.output}
                  onChange={(v) => {
                    const days = [...form.days]
                    days[i] = { ...day, output: v }
                    set({ days })
                  }}
                />
              </div>
            </section>
          ))}
        </div>
      )}

      {tab === 'ket-qua' && (
        <div className="space-y-6">
          <section className="card">
            <h2 className="font-display text-lg font-bold">Kết quả đầu ra mang về</h2>
            <div className="mt-4">
              <LineList label="Danh mục" rows={10} value={form.deliverables} onChange={(v) => set({ deliverables: v })} />
            </div>
          </section>

          <section className="card">
            <h2 className="font-display text-lg font-bold">Chỉ số hiệu quả</h2>
            <p className="mt-1 text-sm muted">
              Đây là mức tham chiếu để thiết kế pilot. Phần <em>Lưu ý</em> bên dưới được chatbot
              nhắc lại mỗi lần nêu con số — không nên xóa.
            </p>
            <div className="mt-4 grid gap-4">
              <TextArea label="Ghi chú mở đầu" rows={2} value={form.kpis.note ?? ''} onChange={(v) => set({ kpis: { ...form.kpis, note: v } })} />
              <div>
                <p className="text-sm font-medium">Các chỉ số</p>
                <div className="mt-2 space-y-2">
                  {(form.kpis.rows ?? []).map((row, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={row.metric}
                        aria-label={`Chỉ số ${i + 1}`}
                        onChange={(e) => {
                          const rows = [...(form.kpis.rows ?? [])]
                          rows[i] = { ...row, metric: e.target.value }
                          set({ kpis: { ...form.kpis, rows } })
                        }}
                        className="rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
                      />
                      <input
                        value={row.target}
                        aria-label={`Mục tiêu ${i + 1}`}
                        onChange={(e) => {
                          const rows = [...(form.kpis.rows ?? [])]
                          rows[i] = { ...row, target: e.target.value }
                          set({ kpis: { ...form.kpis, rows } })
                        }}
                        className="rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <TextArea
                label="Lưu ý về chỉ số"
                rows={3}
                hint="Nội dung khẳng định đây là mức tham chiếu, không phải cam kết."
                value={form.kpis.caveat ?? ''}
                onChange={(v) => set({ kpis: { ...form.kpis, caveat: v } })}
              />
            </div>
          </section>

          <section className="card">
            <h2 className="font-display text-lg font-bold">Dữ liệu mang theo</h2>
            <div className="mt-4">
              <LineList label="Danh mục" rows={8} value={form.dataToBring} onChange={(v) => set({ dataToBring: v })} />
            </div>
          </section>
        </div>
      )}

      {tab === 'phan-mem' && (
        <div className="space-y-6">
          <section className="card">
            <h2 className="font-display text-lg font-bold">Bộ phần mềm chuyển giao</h2>
            <div className="mt-4 grid gap-4">
              <Field label="Tên bộ phần mềm" value={form.software.name ?? ''} onChange={(v) => set({ software: { ...form.software, name: v } })} />
              <TextArea label="Giới thiệu" rows={3} value={form.software.intro ?? ''} onChange={(v) => set({ software: { ...form.software, intro: v } })} />
              <TextArea label="Phạm vi chuyển giao" rows={4} value={form.software.scope ?? ''} onChange={(v) => set({ software: { ...form.software, scope: v } })} />
              <TextArea label="Ghi chú" rows={2} value={form.software.note ?? ''} onChange={(v) => set({ software: { ...form.software, note: v } })} />
            </div>
          </section>

          <section className="card">
            <h2 className="font-display text-lg font-bold">
              Module ({(form.software.modules ?? []).length})
            </h2>
            <div className="mt-4 space-y-3">
              {(form.software.modules ?? []).map((mod, i) => (
                <div key={mod.no} className="grid gap-2 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs muted">{String(mod.no).padStart(2, '0')}</span>
                    <input
                      value={mod.name}
                      aria-label={`Tên module ${mod.no}`}
                      onChange={(e) => {
                        const modules = [...(form.software.modules ?? [])]
                        modules[i] = { ...mod, name: e.target.value }
                        set({ software: { ...form.software, modules } })
                      }}
                      className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm font-medium outline-none focus:border-brand-500"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={mod.description}
                    aria-label={`Mô tả module ${mod.no}`}
                    onChange={(e) => {
                      const modules = [...(form.software.modules ?? [])]
                      modules[i] = { ...mod, description: e.target.value }
                      set({ software: { ...form.software, modules } })
                    }}
                    className="w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'nguyen-tac' && (
        <div className="space-y-6">
          <section className="card">
            <h2 className="font-display text-lg font-bold">Nguyên tắc AI có trách nhiệm</h2>
            <p className="mt-1 rounded-lg border-l-2 border-red-500 bg-red-50 p-3 text-sm dark:bg-red-900/20">
              Những nguyên tắc này lấy từ ràng buộc ghi trong thư mời và được chatbot bắt buộc tuân
              thủ. Sửa hoặc xóa sẽ nới lỏng rào chắn — chỉ làm khi thư mời thay đổi.
            </p>
            <div className="mt-4">
              <LineList label="Nguyên tắc" rows={8} value={form.responsibleAi} onChange={(v) => set({ responsibleAi: v })} />
            </div>
          </section>

          <section className="card">
            <h2 className="font-display text-lg font-bold">Đối tượng nên cử đi học</h2>
            <div className="mt-4 grid gap-4">
              <TextArea
                label="Ghi chú"
                rows={3}
                value={String(form.audience.note ?? '')}
                onChange={(v) => set({ audience: { ...form.audience, note: v } })}
              />
              <Field
                label="Số người khuyến nghị"
                value={String(form.audience.headcount ?? '')}
                onChange={(v) => set({ audience: { ...form.audience, headcount: v } })}
              />
              <div>
                <p className="text-sm font-medium">Thành phần</p>
                <div className="mt-2 space-y-2">
                  {(form.audience.rows ?? []).map((row, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={row.role}
                        aria-label={`Thành phần ${i + 1}`}
                        onChange={(e) => {
                          const rows = [...(form.audience.rows ?? [])]
                          rows[i] = { ...row, role: e.target.value }
                          set({ audience: { ...form.audience, rows } })
                        }}
                        className="rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
                      />
                      <input
                        value={row.duty}
                        aria-label={`Vai trò ${i + 1}`}
                        onChange={(e) => {
                          const rows = [...(form.audience.rows ?? [])]
                          rows[i] = { ...row, duty: e.target.value }
                          set({ audience: { ...form.audience, rows } })
                        }}
                        className="rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="font-display text-lg font-bold">So với khóa khác</h2>
            <p className="mt-1 text-sm muted">
              Chatbot dùng phần này khi có người hỏi hai khóa khác nhau thế nào.
            </p>
            <div className="mt-4 space-y-3">
              {form.relatedCourses.map((rel, i) => (
                <div key={rel.code} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{courseName(rel.code)}</p>
                  <textarea
                    rows={3}
                    value={rel.reason}
                    aria-label={`Lý do phân biệt với ${rel.code}`}
                    onChange={(e) => {
                      const relatedCourses = [...form.relatedCourses]
                      relatedCourses[i] = { ...rel, reason: e.target.value }
                      set({ relatedCourses })
                    }}
                    className="mt-2 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <SaveBar
        dirty={dirty}
        saving={saving}
        notice={notice}
        onSave={save}
        onReset={() => setForm(structuredClone(data))}
      />
    </>
  )
}
