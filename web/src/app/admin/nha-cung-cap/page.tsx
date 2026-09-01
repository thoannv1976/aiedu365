'use client'

import { useState } from 'react'

import { ErrorNotice, PageHeader, useAdminData } from '@/components/admin/Panels'
import { adminDelete, adminGet, adminPost, adminPut } from '@/lib/admin'

type Provider = {
  id: string
  label: string
  description: string
  needsKey: boolean
  supportsChat: boolean
  supportsEmbedding: boolean
  keyHint: string
  defaultChatModel: string
  defaultReasoningModel: string
  defaultEmbeddingModel: string
  keyConfigured: boolean
  keyPreview: string
  keySource: string
  keyUpdatedAt: string
}

type Active = {
  chatProvider: string
  embeddingProvider: string
  chatModel: string
  reasoningModel: string
  embeddingModel: string
  updatedAt: string
  updatedBy: string
}

type ProvidersResponse = {
  providers: Provider[]
  active: Active
  chatProviders: string[]
  embeddingProviders: string[]
  problems: string[]
}

type TestResult = {
  ok: boolean
  label: string
  error?: string
  chat?: { ok: boolean; latencyMs?: number; sample?: string; error?: string }
  embedding?: { ok: boolean; latencyMs?: number; dimensions?: number; error?: string; unsupported?: boolean }
}

function KeyCard({
  provider,
  isActive,
  onChanged,
  onNotice,
}: {
  provider: Provider
  isActive: boolean
  onChanged: () => void
  onNotice: (message: string, tone?: 'ok' | 'error') => void
}) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [test, setTest] = useState<TestResult | null>(null)

  const save = async () => {
    setBusy(true)
    try {
      const res = await adminPut<{ message: string }>(`/providers/${provider.id}/key`, {
        apiKey: value,
      })
      setValue('')
      onNotice(res.message)
      onChanged()
    } catch (err) {
      onNotice(err instanceof Error ? err.message : 'Không lưu được khóa.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const runTest = async () => {
    setBusy(true)
    setTest(null)
    try {
      setTest(await adminPost<TestResult>(`/providers/${provider.id}/test`))
    } catch (err) {
      onNotice(err instanceof Error ? err.message : 'Không kiểm tra được.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const removeKey = async () => {
    if (!confirm(`Xóa khóa API của ${provider.label}?`)) return
    setBusy(true)
    try {
      const res = await adminDelete<{ message: string }>(`/providers/${provider.id}/key`)
      onNotice(res.message)
      onChanged()
    } catch (err) {
      onNotice(err instanceof Error ? err.message : 'Không xóa được.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`card ${isActive ? 'border-brand-500' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold">{provider.label}</h3>
          <p className="mt-1 max-w-prose text-sm muted">{provider.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {isActive && (
            <span className="chip border-brand-500 text-[11px] text-brand-700 dark:text-brand-300">
              đang dùng
            </span>
          )}
          {!provider.supportsEmbedding && (
            <span className="chip border-[rgb(var(--border))] text-[11px] muted">
              không có embedding
            </span>
          )}
          {provider.needsKey ? (
            provider.keyConfigured ? (
              <span className="chip border-emerald-500 text-[11px] text-emerald-700 dark:text-emerald-400">
                đã có khóa {provider.keyPreview}
              </span>
            ) : (
              <span className="chip border-amber-500 text-[11px] text-amber-700 dark:text-amber-400">
                chưa có khóa
              </span>
            )
          ) : (
            <span className="chip border-[rgb(var(--border))] text-[11px] muted">dùng IAM</span>
          )}
        </div>
      </div>

      {provider.needsKey && (
        <div className="mt-4">
          <label htmlFor={`key-${provider.id}`} className="block text-sm font-medium">
            {provider.keyConfigured ? 'Thay khóa API' : 'Khóa API'}
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <input
              id={`key-${provider.id}`}
              type="password"
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={provider.keyConfigured ? 'Dán khóa mới để thay' : 'Dán khóa vào đây'}
              className="min-w-64 flex-1 rounded-lg border bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={save}
              disabled={busy || value.trim().length < 12}
              className="btn-primary !px-4 !py-2 text-sm"
            >
              Lưu khóa
            </button>
          </div>
          {provider.keyHint && <p className="mt-1.5 text-xs muted">{provider.keyHint}</p>}
          {provider.keySource === 'memory' && (
            <p className="mt-2 rounded-lg border-l-2 border-amber-500 bg-amber-50 p-2.5 text-xs dark:bg-amber-900/20">
              Khóa đang nằm trong bộ nhớ tiến trình và sẽ mất khi service khởi động lại. Trên GCP
              cần cấp quyền Secret Manager cho service account.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runTest}
          disabled={busy || (provider.needsKey && !provider.keyConfigured)}
          className="btn-outline !px-4 !py-2 text-xs"
        >
          {busy ? 'Đang kiểm tra…' : 'Kiểm tra kết nối'}
        </button>
        {provider.needsKey && provider.keyConfigured && (
          <button
            type="button"
            onClick={removeKey}
            disabled={busy}
            className="text-xs text-red-600 hover:underline dark:text-red-400"
          >
            Xóa khóa
          </button>
        )}
        <span className="text-xs muted">
          Model mặc định: {provider.defaultChatModel}
          {provider.supportsEmbedding && ` · ${provider.defaultEmbeddingModel}`}
        </span>
      </div>

      {test && (
        <div className="mt-4 space-y-2 rounded-lg border p-3 text-sm">
          <p className="font-medium">
            {test.ok ? (
              <span className="text-emerald-700 dark:text-emerald-400">Kết nối được.</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">Chưa kết nối được.</span>
            )}
          </p>
          {test.error && <p className="text-xs muted">{test.error}</p>}
          {test.chat && (
            <p className="text-xs muted">
              Sinh văn bản:{' '}
              {test.chat.ok
                ? `được, ${test.chat.latencyMs} ms — trả lời “${test.chat.sample}”`
                : test.chat.error}
            </p>
          )}
          {test.embedding && (
            <p className="text-xs muted">
              Tạo vector:{' '}
              {test.embedding.unsupported
                ? 'nhà cung cấp này không có dịch vụ embedding'
                : test.embedding.ok
                  ? `được, ${test.embedding.latencyMs} ms — ${test.embedding.dimensions} chiều`
                  : test.embedding.error}
            </p>
          )}
        </div>
      )}
    </article>
  )
}

export default function ProvidersPage() {
  const { data, error, loading, reload } = useAdminData<ProvidersResponse>(() =>
    adminGet('/providers'),
  )
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null)
  const [form, setForm] = useState<Partial<Active>>({})
  const [saving, setSaving] = useState(false)

  const show = (text: string, tone: 'ok' | 'error' = 'ok') => setNotice({ text, tone })

  if (error) return <ErrorNotice error={error} />
  if (loading || !data) return <p className="muted">Đang tải…</p>

  const active = { ...data.active, ...form }
  const dirty = Object.keys(form).length > 0
  const byId = new Map(data.providers.map((p) => [p.id, p]))
  const chatSpec = byId.get(active.chatProvider)
  const embedSpec = byId.get(active.embeddingProvider)
  const embeddingWillChange =
    active.embeddingProvider !== data.active.embeddingProvider ||
    active.embeddingModel !== data.active.embeddingModel

  const apply = async () => {
    setSaving(true)
    try {
      const res = await adminPut<{ message: string }>('/providers/active', active)
      show(res.message)
      setForm({})
      reload()
    } catch (err) {
      show(err instanceof Error ? err.message : 'Không áp dụng được.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Nhà cung cấp AI"
        description="Nhập khóa API của Claude, OpenAI hoặc Gemini, rồi chọn bên nào trả lời câu hỏi và bên nào tạo vector truy hồi. Thay đổi có hiệu lực ngay, không cần deploy lại."
      />

      {notice && (
        <p
          className={`mb-5 rounded-lg border-l-2 p-3 text-sm ${
            notice.tone === 'ok'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-red-500 bg-red-50 dark:bg-red-900/20'
          }`}
        >
          {notice.text}
        </p>
      )}

      {data.problems.length > 0 && (
        <div className="mb-6 rounded-lg border-l-2 border-amber-500 bg-amber-50 p-4 text-sm dark:bg-amber-900/20">
          <p className="font-medium">Cấu hình hiện tại chưa chạy được:</p>
          <ul className="mt-2 space-y-1">
            {data.problems.map((p) => (
              <li key={p}>· {p}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="card">
        <h2 className="font-display text-lg font-bold">Đang sử dụng</h2>
        <p className="mt-1 text-sm muted">
          Chỉ chọn được nhà cung cấp đã nhập khóa. Claude không có dịch vụ embedding, nên nếu dùng
          Claude để trả lời thì cần chọn thêm một bên khác cho phần truy hồi.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <label htmlFor="chat-provider" className="block text-sm font-medium">
              Trả lời câu hỏi
            </label>
            <select
              id="chat-provider"
              value={active.chatProvider}
              onChange={(e) => {
                const spec = byId.get(e.target.value)
                setForm({
                  ...form,
                  chatProvider: e.target.value,
                  chatModel: spec?.defaultChatModel,
                  reasoningModel: spec?.defaultReasoningModel,
                })
              }}
              className="mt-1.5 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              {data.chatProviders.map((id) => {
                const p = byId.get(id)!
                const blocked = p.needsKey && !p.keyConfigured
                return (
                  <option key={id} value={id} disabled={blocked}>
                    {p.label}
                    {blocked ? ' — chưa có khóa' : ''}
                  </option>
                )
              })}
            </select>

            <div className="mt-3 grid gap-3">
              <div>
                <label htmlFor="chat-model" className="block text-xs font-medium muted">
                  Model cho câu tra cứu
                </label>
                <input
                  id="chat-model"
                  value={active.chatModel}
                  onChange={(e) => setForm({ ...form, chatModel: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label htmlFor="reasoning-model" className="block text-xs font-medium muted">
                  Model cho câu so sánh và định tuyến khóa
                </label>
                <input
                  id="reasoning-model"
                  value={active.reasoningModel}
                  onChange={(e) => setForm({ ...form, reasoningModel: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="embed-provider" className="block text-sm font-medium">
              Tạo vector truy hồi
            </label>
            <select
              id="embed-provider"
              value={active.embeddingProvider}
              onChange={(e) => {
                const spec = byId.get(e.target.value)
                setForm({
                  ...form,
                  embeddingProvider: e.target.value,
                  embeddingModel: spec?.defaultEmbeddingModel,
                })
              }}
              className="mt-1.5 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              {data.embeddingProviders.map((id) => {
                const p = byId.get(id)!
                const blocked = p.needsKey && !p.keyConfigured
                return (
                  <option key={id} value={id} disabled={blocked}>
                    {p.label}
                    {blocked ? ' — chưa có khóa' : ''}
                  </option>
                )
              })}
            </select>

            <div className="mt-3">
              <label htmlFor="embed-model" className="block text-xs font-medium muted">
                Model embedding
              </label>
              <input
                id="embed-model"
                value={active.embeddingModel}
                onChange={(e) => setForm({ ...form, embeddingModel: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-brand-500"
              />
            </div>

            {embeddingWillChange && (
              <p className="mt-3 rounded-lg border-l-2 border-amber-500 bg-amber-50 p-3 text-xs dark:bg-amber-900/20">
                Đổi bên tạo vector là đổi hẳn không gian vector — mọi vector cũ trở nên vô nghĩa.
                Hệ thống sẽ tự index lại Knowledge Base ngay khi anh/chị áp dụng, mất khoảng vài
                chục giây.
              </p>
            )}
          </div>
        </div>

        {chatSpec && embedSpec && (
          <p className="mt-5 text-sm muted">
            Cấu hình sẽ áp dụng: <strong>{chatSpec.label}</strong> trả lời câu hỏi,{' '}
            <strong>{embedSpec.label}</strong> tạo vector truy hồi.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={apply}
            disabled={!dirty || saving}
            className="btn-primary !px-4 !py-2 text-sm"
          >
            {saving ? 'Đang áp dụng…' : 'Áp dụng'}
          </button>
          {dirty && (
            <button type="button" onClick={() => setForm({})} className="btn-outline !px-4 !py-2 text-sm">
              Hủy
            </button>
          )}
          {data.active.updatedBy && !dirty && (
            <span className="text-xs muted">
              Lần đổi gần nhất: {data.active.updatedBy}
              {data.active.updatedAt &&
                ` · ${new Date(data.active.updatedAt).toLocaleString('vi-VN')}`}
            </span>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">Khóa API</h2>
        <p className="mt-1 max-w-prose text-sm muted">
          Khóa được lưu vào Secret Manager của GCP và <strong>không đọc ngược ra được</strong> —
          kể cả tài khoản Super Admin cũng chỉ thấy 4 ký tự cuối. Muốn đổi thì dán khóa mới đè lên.
        </p>

        <div className="mt-5 space-y-4">
          {data.providers
            .filter((p) => p.id !== 'echo')
            .map((provider) => (
              <KeyCard
                key={provider.id}
                provider={provider}
                isActive={
                  provider.id === data.active.chatProvider ||
                  provider.id === data.active.embeddingProvider
                }
                onChanged={reload}
                onNotice={show}
              />
            ))}
        </div>
      </section>
    </>
  )
}
