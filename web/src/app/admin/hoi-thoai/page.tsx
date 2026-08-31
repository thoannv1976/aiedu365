'use client'

import { useState } from 'react'

import { ErrorNotice, PageHeader, useAdminData } from '@/components/admin/Panels'
import { adminGet, adminPost } from '@/lib/admin'

type Conversation = {
  id: string
  sessionId: string
  question: string
  intent: string
  answered: boolean
  fallbackReason: string
  courseCodes: string[]
  topScore: number
  violations: string[]
  feedback?: 'up' | 'down'
  _createdAt?: string
}

export default function ConversationsPage() {
  const [onlyUnanswered, setOnlyUnanswered] = useState(false)
  const [promoting, setPromoting] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [notice, setNotice] = useState('')

  const { data, error, loading, reload } = useAdminData<Conversation[]>(
    () => adminGet(`/conversations?only_unanswered=${onlyUnanswered}&limit=150`),
    [onlyUnanswered],
  )

  const promote = async (id: string) => {
    if (!answer.trim()) return
    try {
      const result = await adminPost<{ message: string }>(`/conversations/${id}/to-faq`, { answer })
      setNotice(result.message)
      setPromoting(null)
      setAnswer('')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Không tạo được FAQ.')
    }
  }

  return (
    <>
      <PageHeader
        title="Hội thoại"
        description="Xem lại câu hỏi người dùng đã gửi. Câu nào bot trả lời chưa đạt thì viết lại thành FAQ — đây là cách chatbot tốt dần lên mà không cần lập trình viên."
        actions={
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyUnanswered}
              onChange={(e) => setOnlyUnanswered(e.target.checked)}
              className="h-4 w-4 accent-[#0b3b75]"
            />
            Chỉ câu chưa trả lời được
          </label>
        }
      />

      {notice && (
        <p className="mb-5 rounded-lg border-l-2 border-emerald-500 bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">
          {notice}
        </p>
      )}
      {error && <ErrorNotice error={error} />}
      {loading && <p className="muted">Đang tải…</p>}
      {data && data.length === 0 && <p className="muted">Chưa có hội thoại nào.</p>}

      <div className="space-y-3">
        {(data ?? []).map((row) => (
          <article key={row.id} className="card !p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="min-w-0 flex-1 font-medium">{row.question}</p>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                <span className="chip border-[rgb(var(--border))] text-[11px] muted">{row.intent}</span>
                {row.answered ? (
                  <span className="chip border-emerald-500 text-[11px] text-emerald-700 dark:text-emerald-400">
                    đã trả lời
                  </span>
                ) : (
                  <span className="chip border-amber-500 text-[11px] text-amber-700 dark:text-amber-400">
                    {row.fallbackReason === 'out_of_scope' ? 'ngoài phạm vi' : 'thiếu ngữ cảnh'}
                  </span>
                )}
                {row.feedback === 'down' && (
                  <span className="chip border-red-500 text-[11px] text-red-600 dark:text-red-400">👎</span>
                )}
                {row.violations?.length > 0 && (
                  <span className="chip border-red-500 text-[11px] text-red-600 dark:text-red-400">
                    guardrail
                  </span>
                )}
              </div>
            </div>

            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs muted">
              <span>Điểm truy hồi {row.topScore?.toFixed(3) ?? '—'}</span>
              {row.courseCodes?.length > 0 && (
                <span>· Khóa: {row.courseCodes.map((c) => c.replace('K', '')).join(', ')}</span>
              )}
              {row._createdAt && <span>· {new Date(row._createdAt).toLocaleString('vi-VN')}</span>}
            </p>

            {promoting === row.id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Viết câu trả lời chuẩn cho câu hỏi này…"
                  className="w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => promote(row.id)} className="btn-primary !px-4 !py-2 text-xs">
                    Lưu thành FAQ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPromoting(null)
                      setAnswer('')
                    }}
                    className="btn-outline !px-4 !py-2 text-xs"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPromoting(row.id)}
                className="mt-3 text-xs text-brand-600 hover:underline dark:text-brand-400"
              >
                Viết câu trả lời chuẩn → tạo FAQ
              </button>
            )}
          </article>
        ))}
      </div>

      {data && data.length > 0 && (
        <button type="button" onClick={reload} className="btn-outline mt-6 !px-4 !py-2 text-xs">
          Tải lại
        </button>
      )}
    </>
  )
}
