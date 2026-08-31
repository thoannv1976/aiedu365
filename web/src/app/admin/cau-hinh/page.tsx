'use client'

import { useEffect, useState } from 'react'

import { ErrorNotice, PageHeader, useAdminData } from '@/components/admin/Panels'
import { adminGet, adminPut } from '@/lib/admin'

type Config = {
  provider: string
  chatModel: string
  reasoningModel: string
  temperature: number
  topK: number
  topKCompare: number
  similarityThreshold: number
  maxOutputTokens: number
  dailyTokenBudget: number
}

type Prompts = {
  default: string
  active: string
  activeVersion: string
  versions: { id: string; label: string; author: string; _createdAt?: string }[]
}

export default function ConfigPage() {
  const { data, error, loading, reload } = useAdminData<Config>(() => adminGet('/config'))
  const prompts = useAdminData<Prompts>(() => adminGet('/prompts'))

  const [form, setForm] = useState<Config | null>(null)
  const [promptText, setPromptText] = useState('')
  const [label, setLabel] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  useEffect(() => {
    if (prompts.data) setPromptText(prompts.data.active)
  }, [prompts.data])

  const saveConfig = async () => {
    if (!form) return
    try {
      await adminPut('/config', form)
      setNotice('Đã lưu cấu hình và áp dụng ngay cho các câu hỏi tiếp theo.')
      reload()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Không lưu được.')
    }
  }

  const savePrompt = async () => {
    try {
      await adminPut('/prompts', { text: promptText, label })
      setNotice('Đã lưu phiên bản prompt mới.')
      setLabel('')
      prompts.reload()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Không lưu được prompt.')
    }
  }

  if (error) return <ErrorNotice error={error} />
  if (loading || !form) return <p className="muted">Đang tải…</p>

  const numberFields: { key: keyof Config; label: string; hint: string; step?: number }[] = [
    { key: 'temperature', label: 'Temperature', hint: 'Thấp hơn = trả lời bám sát tài liệu hơn', step: 0.1 },
    { key: 'topK', label: 'Top-K (câu tra cứu)', hint: 'Số đoạn tài liệu lấy về mỗi câu hỏi' },
    { key: 'topKCompare', label: 'Top-K (câu so sánh)', hint: 'Rộng hơn để phủ đủ các khóa được so sánh' },
    {
      key: 'similarityThreshold',
      label: 'Ngưỡng tương đồng',
      hint: 'Dưới ngưỡng này bot từ chối thay vì đoán. Tăng nếu bot trả lời lan man, giảm nếu bot từ chối quá nhiều',
      step: 0.01,
    },
    { key: 'maxOutputTokens', label: 'Độ dài trả lời tối đa', hint: 'Tính bằng token' },
  ]

  return (
    <>
      <PageHeader
        title="Cấu hình AI"
        description="Thay đổi áp dụng ngay, không cần deploy lại. Mọi thay đổi được ghi vào nhật ký kiểm toán."
      />

      {notice && (
        <p className="mb-5 rounded-lg border-l-2 border-emerald-500 bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">
          {notice}
        </p>
      )}

      <section className="card">
        <h2 className="font-display text-lg font-bold">Mô hình và truy hồi</h2>
        <p className="mt-1 text-sm muted">
          Nhà cung cấp hiện tại: <strong>{form.provider}</strong>. Đổi nhà cung cấp bằng biến môi
          trường <code className="rounded bg-black/5 px-1 dark:bg-white/10">LLM_PROVIDER</code>.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="chatModel" className="block text-sm font-medium">
              Model cho câu tra cứu
            </label>
            <input
              id="chatModel"
              value={form.chatModel}
              onChange={(e) => setForm({ ...form, chatModel: e.target.value })}
              className="mt-1.5 w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label htmlFor="reasoningModel" className="block text-sm font-medium">
              Model cho câu so sánh và định tuyến
            </label>
            <input
              id="reasoningModel"
              value={form.reasoningModel}
              onChange={(e) => setForm({ ...form, reasoningModel: e.target.value })}
              className="mt-1.5 w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-brand-500"
            />
          </div>

          {numberFields.map((field) => (
            <div key={String(field.key)}>
              <label htmlFor={String(field.key)} className="block text-sm font-medium">
                {field.label}
              </label>
              <input
                id={String(field.key)}
                type="number"
                step={field.step ?? 1}
                value={form[field.key] as number}
                onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })}
                className="mt-1.5 w-full rounded-lg border bg-transparent px-3 py-2 text-sm tabular-nums outline-none focus:border-brand-500"
              />
              <p className="mt-1 text-xs muted">{field.hint}</p>
            </div>
          ))}
        </div>

        <button type="button" onClick={saveConfig} className="btn-primary mt-6 !px-4 !py-2 text-sm">
          Lưu cấu hình
        </button>
      </section>

      <section className="card mt-6">
        <h2 className="font-display text-lg font-bold">System prompt</h2>
        <p className="mt-1 text-sm muted">
          Quy tắc trả lời của chatbot. Mỗi lần lưu tạo một phiên bản mới, có thể quay lui.
          {prompts.data && (
            <>
              {' '}
              Phiên bản đang dùng: <strong>{prompts.data.activeVersion}</strong>.
            </>
          )}
        </p>

        <textarea
          rows={16}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          className="mt-4 w-full resize-y rounded-lg border bg-transparent px-3 py-2.5 font-mono text-xs leading-relaxed outline-none focus:border-brand-500"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nhãn phiên bản (ví dụ: thêm quy tắc về học phí)"
            className="min-w-64 flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button type="button" onClick={savePrompt} className="btn-primary !px-4 !py-2 text-sm">
            Lưu phiên bản mới
          </button>
          <button
            type="button"
            onClick={() => prompts.data && setPromptText(prompts.data.default)}
            className="btn-outline !px-4 !py-2 text-sm"
          >
            Khôi phục mặc định
          </button>
        </div>

        {prompts.data && prompts.data.versions.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium">Lịch sử phiên bản</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {prompts.data.versions.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center gap-2 muted">
                  <span className="font-mono text-xs">{v.id.slice(0, 8)}</span>
                  <span>{v.label || '(không nhãn)'}</span>
                  <span className="text-xs">· {v.author}</span>
                  {v._createdAt && (
                    <span className="text-xs">· {new Date(v._createdAt).toLocaleString('vi-VN')}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  )
}
