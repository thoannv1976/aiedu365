'use client'

import { useState } from 'react'

import { ErrorNotice, PageHeader, StatCard, useAdminData } from '@/components/admin/Panels'
import { adminGet, adminPost } from '@/lib/admin'

type Chunk = {
  id: string
  courseCode: string | null
  sourceDoc: string
  section: string
  title: string
  content: string
  tokens: number
}

type TestResult = {
  query: string
  threshold: number
  wouldAnswer: boolean
  hits: {
    chunkId: string
    courseCode: string | null
    title: string
    section: string
    score: number
    preview: string
  }[]
}

export default function KnowledgeBasePage() {
  const [filter, setFilter] = useState('')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [notice, setNotice] = useState('')

  const { data, error, loading, reload } = useAdminData<Chunk[]>(
    () => adminGet(`/kb/chunks${filter ? `?course=${filter}` : ''}`),
    [filter],
  )

  const reindex = async () => {
    setNotice('Đang index lại…')
    try {
      const res = await adminPost<{ message: string }>('/kb/reindex')
      setNotice(res.message)
      reload()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Index lại thất bại.')
    }
  }

  const runTest = async () => {
    if (!query.trim()) return
    setTesting(true)
    try {
      setResult(await adminPost<TestResult>('/kb/test-retrieval', { query, top_k: 8 }))
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Không chạy được thử nghiệm.')
    } finally {
      setTesting(false)
    }
  }

  const codes = Array.from(new Set((data ?? []).map((c) => c.courseCode).filter(Boolean))) as string[]
  const totalTokens = (data ?? []).reduce((sum, c) => sum + c.tokens, 0)

  return (
    <>
      <PageHeader
        title="Knowledge Base"
        description="Kho tri thức chatbot dùng để trả lời. Sau khi sửa nội dung khóa học hoặc thêm FAQ, bấm “Cập nhật” để chatbot áp dụng ngay."
        actions={
          <button type="button" onClick={reindex} className="btn-primary !px-4 !py-2 text-xs">
            Cập nhật Knowledge Base
          </button>
        }
      />

      {notice && (
        <p className="mb-5 rounded-lg border-l-2 border-brand-500 bg-brand-50 p-3 text-sm dark:bg-brand-900/20">
          {notice}
        </p>
      )}
      {error && <ErrorNotice error={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Số chunk" value={data?.length ?? 0} />
        <StatCard label="Token ước tính" value={totalTokens.toLocaleString('vi-VN')} />
        <StatCard label="Nguồn" value={codes.length} hint="Số khóa có nội dung trong kho" />
      </div>

      <section className="card mt-8">
        <h2 className="font-display text-lg font-bold">Thử truy hồi</h2>
        <p className="mt-1 text-sm muted">
          Nhập một câu hỏi để xem chatbot sẽ lấy đoạn tài liệu nào và có đủ căn cứ để trả lời không.
          Đây là cách nhanh nhất để kiểm tra vì sao bot trả lời sai.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runTest()}
            placeholder="Ví dụ: Khóa 27 nên cử bao nhiêu người?"
            className="min-w-64 flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button type="button" onClick={runTest} disabled={testing} className="btn-outline !px-4 !py-2 text-sm">
            {testing ? 'Đang thử…' : 'Thử'}
          </button>
        </div>

        {result && (
          <div className="mt-5">
            <p className="text-sm">
              {result.wouldAnswer ? (
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  Đủ căn cứ — chatbot sẽ trả lời.
                </span>
              ) : (
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  Không đủ căn cứ — chatbot sẽ từ chối và mời liên hệ ban tổ chức.
                </span>
              )}
              <span className="muted"> (ngưỡng {result.threshold})</span>
            </p>
            <ol className="mt-3 space-y-2">
              {result.hits.map((hit, i) => (
                <li key={hit.chunkId} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {i + 1}. {hit.title}
                    </span>
                    <span className="font-mono text-xs tabular-nums muted">{hit.score.toFixed(4)}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-3 text-xs muted">{hit.preview}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-bold">Nội dung trong kho</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Lọc theo khóa"
            className="rounded-lg border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Tất cả khóa</option>
            {['K21', 'K22', 'K23', 'K24', 'K25', 'K26', 'K27', 'K28'].map((code) => (
              <option key={code} value={code}>
                Khóa {code.replace('K', '')}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="mt-4 muted">Đang tải…</p>}

        <div className="mt-4 space-y-2">
          {(data ?? []).map((chunk) => (
            <details key={chunk.id} className="card !p-4">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{chunk.title}</span>
                <span className="flex gap-2 text-xs muted">
                  <span className="chip border-[rgb(var(--border))] text-[11px]">{chunk.sourceDoc}</span>
                  <span className="tabular-nums">{chunk.tokens} token</span>
                </span>
              </summary>
              <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-black/5 p-3 text-xs leading-relaxed dark:bg-white/5">
                {chunk.content}
              </pre>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
