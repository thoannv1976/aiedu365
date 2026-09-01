'use client'

import { useEffect, useState } from 'react'

import { Field, LineList, SaveBar, TextArea } from '@/components/admin/SaveBar'
import { ErrorNotice, PageHeader, useAdminData } from '@/components/admin/Panels'
import { adminGet, adminPut } from '@/lib/admin'

type Site = {
  programName: string
  organizer: string
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    primaryCta: { label: string; href: string }
    secondaryCta: { label: string; href: string }
  }
  differentiators: { title: string; description: string }[]
  contact: {
    unit: string
    address: string
    email: string
    phone: string
    registrationDeadline: string
    note: string
  }
  chat: { greeting: string; suggestions: string[]; fallback: string }
}

export default function SiteContentPage() {
  const { data, error, loading, reload } = useAdminData<Site>(() => adminGet('/site'))
  const [form, setForm] = useState<Site | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (data) setForm(structuredClone(data))
  }, [data])

  if (error) return <ErrorNotice error={error} />
  if (loading || !form || !data) return <p className="muted">Đang tải…</p>

  const dirty = JSON.stringify(form) !== JSON.stringify(data)

  const save = async () => {
    setSaving(true)
    try {
      const res = await adminPut<{ message: string }>('/site', form)
      setNotice(res.message)
      reload()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Không lưu được.')
    } finally {
      setSaving(false)
    }
  }

  const contactEmpty = !form.contact.email && !form.contact.phone && !form.contact.unit

  return (
    <>
      <PageHeader
        title="Nội dung trang"
        description="Sửa nội dung hiển thị trên trang công khai. Không cần deploy lại."
      />

      {contactEmpty && (
        <p className="mb-6 rounded-lg border-l-2 border-amber-500 bg-amber-50 p-4 text-sm dark:bg-amber-900/20">
          <strong>Chưa có thông tin liên hệ.</strong> Chatbot đang trả lời “ban tổ chức sẽ cung cấp”
          cho mọi câu hỏi về thời gian, địa điểm và đầu mối. Điền phần <em>Đầu mối liên hệ</em> bên
          dưới rồi bấm <em>Cập nhật Knowledge Base</em> là chatbot trả lời được ngay.
        </p>
      )}

      <div className="space-y-6">
        <section className="card">
          <h2 className="font-display text-lg font-bold">Đơn vị tổ chức</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Tên chương trình"
              value={form.programName}
              onChange={(v) => setForm({ ...form, programName: v })}
              className="sm:col-span-2"
            />
            <Field
              label="Đơn vị tổ chức"
              hint="Hiện ở chân trang. Để trống thì không hiển thị."
              value={form.organizer}
              onChange={(v) => setForm({ ...form, organizer: v })}
              className="sm:col-span-2"
            />
          </div>
        </section>

        <section className="card">
          <h2 className="font-display text-lg font-bold">Đầu mối liên hệ</h2>
          <p className="mt-1 text-sm muted">
            Chatbot dùng đúng những thông tin này để trả lời câu hỏi về đăng ký. Trường nào để
            trống thì chatbot nói rằng ban tổ chức sẽ cung cấp — nó không tự bịa.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Đơn vị đầu mối"
              value={form.contact.unit}
              onChange={(v) => setForm({ ...form, contact: { ...form.contact, unit: v } })}
            />
            <Field
              label="Hạn đăng ký"
              placeholder="Ví dụ: 30/09/2026"
              value={form.contact.registrationDeadline}
              onChange={(v) =>
                setForm({ ...form, contact: { ...form.contact, registrationDeadline: v } })
              }
            />
            <Field
              label="Email"
              type="email"
              value={form.contact.email}
              onChange={(v) => setForm({ ...form, contact: { ...form.contact, email: v } })}
            />
            <Field
              label="Điện thoại"
              value={form.contact.phone}
              onChange={(v) => setForm({ ...form, contact: { ...form.contact, phone: v } })}
            />
            <Field
              label="Địa chỉ"
              value={form.contact.address}
              onChange={(v) => setForm({ ...form, contact: { ...form.contact, address: v } })}
              className="sm:col-span-2"
            />
          </div>
        </section>

        <section className="card">
          <h2 className="font-display text-lg font-bold">Phần đầu trang chủ</h2>
          <div className="mt-4 grid gap-4">
            <Field
              label="Dòng nhỏ phía trên"
              value={form.hero.eyebrow}
              onChange={(v) => setForm({ ...form, hero: { ...form.hero, eyebrow: v } })}
            />
            <Field
              label="Tiêu đề chính"
              value={form.hero.title}
              onChange={(v) => setForm({ ...form, hero: { ...form.hero, title: v } })}
            />
            <TextArea
              label="Mô tả"
              rows={3}
              value={form.hero.subtitle}
              onChange={(v) => setForm({ ...form, hero: { ...form.hero, subtitle: v } })}
            />
          </div>
        </section>

        <section className="card">
          <h2 className="font-display text-lg font-bold">Lời chào và gợi ý của chatbot</h2>
          <div className="mt-4 grid gap-4">
            <TextArea
              label="Lời chào"
              rows={3}
              value={form.chat.greeting}
              onChange={(v) => setForm({ ...form, chat: { ...form.chat, greeting: v } })}
            />
            <LineList
              label="Câu hỏi gợi ý"
              hint="Mỗi dòng là một gợi ý hiện khi người dùng mở khung chat."
              value={form.chat.suggestions}
              onChange={(v) => setForm({ ...form, chat: { ...form.chat, suggestions: v } })}
            />
            <TextArea
              label="Câu trả lời khi không đủ căn cứ"
              rows={3}
              hint="Dùng khi chatbot không tìm thấy tài liệu liên quan."
              value={form.chat.fallback}
              onChange={(v) => setForm({ ...form, chat: { ...form.chat, fallback: v } })}
            />
          </div>
        </section>
      </div>

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
