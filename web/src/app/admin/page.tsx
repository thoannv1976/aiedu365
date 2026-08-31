'use client'

import { BarList, ErrorNotice, PageHeader, StatCard, useAdminData } from '@/components/admin/Panels'
import { adminGet } from '@/lib/admin'

type Analytics = {
  totals: {
    messages: number
    leads: number
    sessions: number
    unanswered: number
    unansweredRate: number
    violations: number
  }
  intents: Record<string, number>
  feedback: { up: number; down: number }
  courseInterest: { code: string; name: string; count: number }[]
  topQuestions: { question: string; count: number }[]
  tokens: { in: number; out: number }
  knowledgeBase: { chunks: number; ready: boolean }
  catalog: { courseCount: number; totalDays: number; moduleCount: number }
}

const INTENT_LABELS: Record<string, string> = {
  lookup: 'Tra cứu',
  compare: 'So sánh khóa',
  routing: 'Định tuyến khóa',
  register: 'Đăng ký',
  out_of_scope: 'Ngoài phạm vi',
}

export default function AdminDashboard() {
  const { data, error, loading } = useAdminData<Analytics>(() => adminGet('/analytics'))

  if (error) return <ErrorNotice error={error} />
  if (loading || !data) return <p className="muted">Đang tải dữ liệu…</p>

  const { totals, feedback } = data
  const rated = feedback.up + feedback.down
  const satisfaction = rated > 0 ? Math.round((feedback.up / rated) * 100) : null

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        description={`${data.catalog.courseCount} khóa · ${data.catalog.totalDays} ngày · ${data.catalog.moduleCount} module phần mềm · Knowledge Base ${data.knowledgeBase.chunks} chunk`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Phiên trò chuyện" value={totals.sessions} />
        <StatCard label="Câu hỏi" value={totals.messages} />
        <StatCard label="Đăng ký" value={totals.leads} tone="good" />
        <StatCard
          label="Câu không trả lời được"
          value={`${totals.unanswered} (${Math.round(totals.unansweredRate * 100)}%)`}
          hint="Gồm cả câu ngoài phạm vi bị từ chối đúng"
          tone={totals.unansweredRate > 0.25 ? 'warn' : 'default'}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Mức hài lòng"
          value={satisfaction === null ? '—' : `${satisfaction}%`}
          hint={rated > 0 ? `${feedback.up} 👍 · ${feedback.down} 👎` : 'Chưa có đánh giá'}
          tone={satisfaction !== null && satisfaction < 70 ? 'warn' : 'good'}
        />
        <StatCard
          label="Guardrail chặn"
          value={totals.violations}
          hint="Câu trả lời vi phạm nguyên tắc, đã được chặn"
          tone={totals.violations > 0 ? 'bad' : 'good'}
        />
        <StatCard label="Token vào" value={data.tokens.in.toLocaleString('vi-VN')} />
        <StatCard label="Token ra" value={data.tokens.out.toLocaleString('vi-VN')} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="font-display text-lg font-bold">Quan tâm theo khóa</h2>
          <p className="mt-1 text-xs muted">
            Tính từ câu hỏi và đăng ký; một lượt đăng ký tính bằng ba lượt hỏi.
          </p>
          <div className="mt-4">
            <BarList
              items={data.courseInterest.map((c) => ({ label: c.name, value: c.count }))}
              emptyText="Chưa có ai hỏi về khóa cụ thể nào."
            />
          </div>
        </section>

        <section className="card">
          <h2 className="font-display text-lg font-bold">Loại câu hỏi</h2>
          <p className="mt-1 text-xs muted">
            Tỷ trọng “định tuyến khóa” cao cho thấy người hỏi chưa tự chọn được khóa.
          </p>
          <div className="mt-4">
            <BarList
              items={Object.entries(data.intents).map(([key, value]) => ({
                label: INTENT_LABELS[key] ?? key,
                value,
              }))}
            />
          </div>
        </section>
      </div>

      <section className="card mt-6">
        <h2 className="font-display text-lg font-bold">Câu hỏi phổ biến</h2>
        <p className="mt-1 text-xs muted">
          Những câu lặp lại nhiều nên được viết thành FAQ để trả lời nhất quán và nhanh hơn.
        </p>
        <div className="mt-4">
          <BarList
            items={data.topQuestions.map((q) => ({ label: q.question, value: q.count }))}
            emptyText="Chưa có câu hỏi nào."
          />
        </div>
      </section>
    </>
  )
}
