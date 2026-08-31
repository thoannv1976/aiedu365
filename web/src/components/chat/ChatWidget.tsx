'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { apiBase, courseName } from '@/lib/api'
import type { Citation } from '@/lib/types'

import { LeadCapture } from './LeadCapture'
import { Markdown } from './Markdown'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  feedback?: 'up' | 'down'
  pending?: boolean
}

const SESSION_KEY = 'aiedu-chat-session'
const HISTORY_KEY = 'aiedu-chat-history'
const LEAD_AFTER_TURNS = 3

function loadSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const fresh = crypto.randomUUID().replace(/-/g, '').slice(0, 20)
    localStorage.setItem(SESSION_KEY, fresh)
    return fresh
  } catch {
    return Math.random().toString(36).slice(2, 18)
  }
}

export function ChatWidget({
  greeting,
  suggestions,
}: {
  greeting: string
  suggestions: string[]
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [courseContext, setCourseContext] = useState<string | null>(null)
  const [leadDismissed, setLeadDismissed] = useState(false)
  const [leadDone, setLeadDone] = useState(false)
  const sessionRef = useRef<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    sessionRef.current = loadSessionId()
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) setMessages(JSON.parse(saved) as Message[])
    } catch {
      // Lịch sử hỏng thì bỏ qua, bắt đầu phiên mới.
    }
  }, [])

  useEffect(() => {
    if (!messages.length) return
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-30)))
    } catch {
      // Bộ nhớ đầy hoặc bị chặn — không ảnh hưởng tới cuộc hội thoại đang diễn ra.
    }
  }, [messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  // Mở chat từ nút "Hỏi về khóa này" trên thẻ khóa học, kèm ngữ cảnh khóa đó.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ course?: string; question?: string }>).detail ?? {}
      setCourseContext(detail.course ?? null)
      setOpen(true)
      if (detail.question) {
        setInput(detail.question)
        window.setTimeout(() => inputRef.current?.focus(), 150)
      }
    }
    window.addEventListener('aiedu:open-chat', handler)
    return () => window.removeEventListener('aiedu:open-chat', handler)
  }, [])

  const send = useCallback(
    async (text: string) => {
      const question = text.trim()
      if (!question || busy) return

      const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: question }
      const assistantId = crypto.randomUUID()
      const history = messages
        .filter((m) => !m.pending)
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }))

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: 'assistant', content: '', pending: true },
      ])
      setInput('')
      setBusy(true)

      try {
        const res = await fetch(`${apiBase}/api/chat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            message: question,
            sessionId: sessionRef.current,
            history,
            courseContext,
          }),
        })

        if (res.status === 429) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    pending: false,
                    content:
                      'Anh/chị đã gửi khá nhiều câu hỏi trong một giờ. Vui lòng thử lại sau, ' +
                      'hoặc liên hệ trực tiếp ban tổ chức.',
                  }
                : m,
            ),
          )
          return
        }
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let answer = ''
        let serverId = assistantId
        let citations: Citation[] = []

        // Server-Sent Events: mỗi khối kết thúc bằng dòng trống.
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const blocks = buffer.split('\n\n')
          buffer = blocks.pop() ?? ''

          for (const block of blocks) {
            const eventLine = block.split('\n').find((l) => l.startsWith('event: '))
            const dataLine = block.split('\n').find((l) => l.startsWith('data: '))
            if (!dataLine) continue
            const payload = JSON.parse(dataLine.slice(6))

            if (eventLine?.includes('delta')) {
              answer += payload.text ?? ''
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: answer } : m)),
              )
            } else if (eventLine?.includes('done')) {
              serverId = payload.messageId ?? assistantId
              citations = (payload.citations ?? []) as Citation[]
            } else if (eventLine?.includes('error')) {
              answer ||= payload.message ?? 'Hệ thống đang bận, xin thử lại.'
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, id: serverId, content: answer, citations, pending: false }
              : m,
          ),
        )
      } catch (error) {
        console.error('[chat]', error)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  pending: false,
                  content:
                    'Xin lỗi, hiện chưa kết nối được tới trợ lý. Anh/chị thử lại sau ít phút ' +
                    'hoặc liên hệ ban tổ chức.',
                }
              : m,
          ),
        )
      } finally {
        setBusy(false)
      }
    },
    [busy, courseContext, messages],
  )

  const rate = async (messageId: string, value: 'up' | 'down') => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback: value } : m)))
    try {
      await fetch(`${apiBase}/api/chat/feedback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionRef.current, messageId, value }),
      })
    } catch {
      // Đánh giá không gửi được thì bỏ qua — không làm phiền người dùng.
    }
  }

  const userTurns = messages.filter((m) => m.role === 'user').length
  const showLead = !leadDismissed && !leadDone && userTurns >= LEAD_AFTER_TURNS && !busy

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-ink-800 px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-ink-700"
          aria-label="Mở trợ lý tư vấn"
        >
          <span aria-hidden className="text-base">💬</span>
          Hỏi trợ lý AI
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Trợ lý tư vấn khóa tập huấn"
          className="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] flex-col border-t surface shadow-2xl animate-slide-up sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[640px] sm:w-[420px] sm:rounded-2xl sm:border"
        >
          <header className="flex items-center justify-between gap-3 border-b px-4 py-3 surface sm:rounded-t-2xl">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Trợ lý tư vấn khóa tập huấn</p>
              <p className="truncate text-xs muted">
                {courseContext
                  ? `Đang trao đổi về ${courseName(courseContext)}`
                  : 'Trả lời dựa trên 08 thư mời chính thức'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {courseContext && (
                <button
                  type="button"
                  onClick={() => setCourseContext(null)}
                  className="rounded px-2 py-1 text-xs muted hover:underline"
                >
                  Bỏ lọc
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng cửa sổ trò chuyện"
                className="rounded-lg p-2 text-lg leading-none muted hover:text-[rgb(var(--text))]"
              >
                ✕
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="rounded-xl rounded-tl-sm border surface px-4 py-3 text-sm leading-relaxed">
                  {greeting}
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="chip border-brand-200 bg-brand-50 text-brand-700 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl rounded-br-sm bg-ink-800 px-4 py-2.5 text-sm text-white">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="space-y-2">
                  <div className="max-w-[92%] rounded-xl rounded-tl-sm border surface px-4 py-3 text-sm">
                    {message.pending && !message.content ? (
                      <span className="inline-flex gap-1" aria-label="Đang soạn câu trả lời">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500" />
                      </span>
                    ) : (
                      <Markdown text={message.content} />
                    )}
                  </div>

                  {!message.pending && message.content && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(message.citations ?? []).slice(0, 3).map((c) => (
                        <span
                          key={c.chunkId}
                          className="chip border-[rgb(var(--border))] text-[11px] muted"
                          title={c.title}
                        >
                          {c.courseCode ? courseName(c.courseCode) : 'Tài liệu chung'}
                        </span>
                      ))}
                      <span className="ml-auto flex gap-1">
                        <button
                          type="button"
                          onClick={() => rate(message.id, 'up')}
                          aria-label="Câu trả lời hữu ích"
                          className={`rounded px-1.5 text-sm ${message.feedback === 'up' ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          onClick={() => rate(message.id, 'down')}
                          aria-label="Câu trả lời chưa đúng"
                          className={`rounded px-1.5 text-sm ${message.feedback === 'down' ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
                        >
                          👎
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              ),
            )}

            {showLead && (
              <LeadCapture
                sessionId={sessionRef.current}
                courseContext={courseContext}
                onDone={() => setLeadDone(true)}
                onDismiss={() => setLeadDismissed(true)}
              />
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="border-t px-3 py-3 surface sm:rounded-b-2xl"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                rows={1}
                maxLength={1500}
                placeholder="Nhập câu hỏi về các khóa tập huấn…"
                aria-label="Câu hỏi của bạn"
                className="max-h-32 flex-1 resize-none rounded-lg border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="btn-primary !px-4 !py-2.5"
                aria-label="Gửi câu hỏi"
              >
                Gửi
              </button>
            </div>
            <p className="mt-2 text-[11px] muted">
              Trợ lý trả lời dựa trên nội dung thư mời. Thông tin về thời gian, địa điểm và kinh phí
              do ban tổ chức cung cấp.
            </p>
          </form>
        </div>
      )}
    </>
  )
}
