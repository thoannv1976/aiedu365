'use client'

import { useState } from 'react'

import { Field, TextArea } from '@/components/admin/SaveBar'
import { ErrorNotice, PageHeader, useAdminData } from '@/components/admin/Panels'
import { adminDelete, adminGet, adminPost, adminPut } from '@/lib/admin'
import { courseName } from '@/lib/api'

type Faq = {
  id: string
  question: string
  answer: string
  category: string
  courseCodes: string[]
  priority: number
  published: boolean
  order: number
}

const COURSES = ['K21', 'K22', 'K23', 'K24', 'K25', 'K26', 'K27', 'K28']

const EMPTY: Omit<Faq, 'id'> = {
  question: '',
  answer: '',
  category: '',
  courseCodes: [],
  priority: 60,
  published: true,
  order: 500,
}

function FaqForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: Omit<Faq, 'id'>
  submitLabel: string
  onSubmit: (value: Omit<Faq, 'id'>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)

  const toggleCourse = (code: string) =>
    setForm({
      ...form,
      courseCodes: form.courseCodes.includes(code)
        ? form.courseCodes.filter((c) => c !== code)
        : [...form.courseCodes, code],
    })

  return (
    <div className="card border-brand-500">
      <div className="grid gap-4">
        <Field label="Câu hỏi" value={form.question} onChange={(v) => setForm({ ...form, question: v })} />
        <TextArea
          label="Câu trả lời"
          rows={5}
          hint="Viết như khi trả lời qua email. Chatbot dùng nguyên văn nội dung này và ưu tiên nó hơn thư mời."
          value={form.answer}
          onChange={(v) => setForm({ ...form, answer: v })}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nhóm" placeholder="Ví dụ: Đăng ký" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Field
            label="Độ ưu tiên"
            type="number"
            hint="Cao hơn = chatbot ưu tiên dùng hơn."
            value={String(form.priority)}
            onChange={(v) => setForm({ ...form, priority: Number(v) || 0 })}
          />
          <Field
            label="Thứ tự hiển thị"
            type="number"
            hint="Nhỏ hơn = hiện trước trên trang Hỏi đáp."
            value={String(form.order)}
            onChange={(v) => setForm({ ...form, order: Number(v) || 0 })}
          />
        </div>

        <div>
          <p className="text-sm font-medium">Khóa liên quan</p>
          <p className="mt-1 text-xs muted">Để trống nếu câu hỏi áp dụng cho cả chương trình.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COURSES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => toggleCourse(code)}
                className={`chip border-[rgb(var(--border))] font-mono text-[11px] ${
                  form.courseCodes.includes(code) ? 'bg-ink-800 text-white' : ''
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="h-4 w-4 accent-[#0b3b75]"
          />
          Hiển thị công khai
        </label>
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

export default function FaqAdminPage() {
  const { data, error, loading, reload } = useAdminData<Faq[]>(() => adminGet('/faqs'))
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
        title="Hỏi đáp"
        description="FAQ hiện trên trang công khai và được chatbot ưu tiên hơn nội dung thư mời. Đây là cách nhanh nhất để sửa một câu trả lời sai."
        actions={
          !creating && (
            <button type="button" onClick={() => setCreating(true)} className="btn-primary !px-4 !py-2 text-xs">
              Thêm câu hỏi
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
          <FaqForm
            initial={EMPTY}
            submitLabel="Thêm câu hỏi"
            onCancel={() => setCreating(false)}
            onSubmit={(value) => run(() => adminPost('/faqs', value))}
          />
        </div>
      )}

      {loading && <p className="muted">Đang tải…</p>}

      <div className="space-y-3">
        {rows.map((faq) =>
          editing === faq.id ? (
            <FaqForm
              key={faq.id}
              initial={faq}
              submitLabel="Lưu thay đổi"
              onCancel={() => setEditing(null)}
              onSubmit={(value) => run(() => adminPut(`/faqs/${faq.id}`, value))}
            />
          ) : (
            <article key={faq.id} className="card !p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="min-w-0 flex-1 font-medium">{faq.question}</p>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {faq.category && (
                    <span className="chip border-[rgb(var(--border))] text-[11px] muted">{faq.category}</span>
                  )}
                  {!faq.published && (
                    <span className="chip border-amber-500 text-[11px] text-amber-700 dark:text-amber-400">
                      đang ẩn
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm muted">{faq.answer}</p>
              {faq.courseCodes.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {faq.courseCodes.map((code) => (
                    <span key={code} className="chip border-[rgb(var(--border))] text-[11px] muted">
                      {courseName(code)}
                    </span>
                  ))}
                </p>
              )}
              <div className="mt-3 flex gap-3 text-xs">
                <button type="button" onClick={() => setEditing(faq.id)} className="text-brand-600 hover:underline dark:text-brand-400">
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Xóa câu hỏi này?')) run(() => adminDelete(`/faqs/${faq.id}`))
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
