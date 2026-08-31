'use client'

import Link from 'next/link'
import { useState } from 'react'

import { apiBase, courseName } from '@/lib/api'
import type { RecommendResponse } from '@/lib/types'

const QUESTIONS = [
  {
    key: 'unitType' as const,
    title: 'Đơn vị của anh/chị phụ trách mảng nào?',
    options: [
      { value: 'dao-tao', label: 'Quản lý đào tạo · Chương trình đào tạo · Cố vấn học tập' },
      { value: 'dam-bao-chat-luong', label: 'Đảm bảo chất lượng · Khảo thí · Kiểm định' },
      { value: 'khoa-hoc', label: 'Quản lý khoa học · Nghiên cứu' },
      { value: 'tap-chi', label: 'Tạp chí khoa học · Tòa soạn · Xuất bản' },
      { value: 'nhan-su', label: 'Tổ chức cán bộ · Hành chính – Tổng hợp · Văn phòng' },
      { value: 'khoa-bo-mon-kinh-doanh', label: 'Khoa/Bộ môn Thương mại điện tử · Kinh doanh số · Marketing số' },
      { value: 'khoa-bo-mon-ngoai-ngu', label: 'Khoa/Bộ môn Ngoại ngữ' },
      { value: 'cntt', label: 'CNTT · Chuyển đổi số · Ban giám hiệu' },
      { value: 'khac', label: 'Đơn vị khác' },
    ],
  },
  {
    key: 'priority' as const,
    title: 'Ưu tiên trước mắt của đơn vị là gì?',
    options: [
      { value: 'tra-cuu', label: 'Tra cứu quy định, biểu mẫu, hồ sơ nhanh hơn' },
      { value: 'tu-dong-hoa', label: 'Tự động hóa các quy trình lặp lại' },
      { value: 'phan-tich-du-lieu', label: 'Phân tích dữ liệu và dashboard cho lãnh đạo' },
      { value: 'day-hoc', label: 'Đưa AI vào giảng dạy và đánh giá sinh viên' },
      { value: 'nen-tang-chung', label: 'Xây nền tảng AI dùng chung cho toàn trường' },
    ],
  },
  {
    key: 'headcount' as const,
    title: 'Đơn vị có thể cử bao nhiêu cán bộ tham dự?',
    options: [
      { value: '1-2', label: '01 – 02 người' },
      { value: '3-5', label: '03 – 05 người' },
      { value: '6-10', label: '06 – 10 người' },
      { value: 'tren-10', label: 'Trên 10 người' },
    ],
  },
]

export function CoursePicker() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({ unitType: '', priority: '', headcount: '' })
  const [result, setResult] = useState<RecommendResponse | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  const submit = async (finalAnswers: typeof answers) => {
    setStatus('loading')
    try {
      const res = await fetch(`${apiBase}/api/recommend`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(finalAnswers),
      })
      if (!res.ok) throw new Error(String(res.status))
      setResult((await res.json()) as RecommendResponse)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  const choose = (value: string) => {
    const key = QUESTIONS[step].key
    const next = { ...answers, [key]: value }
    setAnswers(next)
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      void submit(next)
    }
  }

  const restart = () => {
    setResult(null)
    setStep(0)
    setAnswers({ unitType: '', priority: '', headcount: '' })
  }

  if (result) {
    return (
      <div className="mt-10 space-y-8">
        <section>
          <h2 className="font-display text-xl font-bold">Khóa phù hợp nhất</h2>
          <div className="mt-4 space-y-4">
            {result.primary.map((item) => (
              <div key={item.code} className="card border-brand-500">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-ink-800 px-2 py-0.5 font-mono text-xs font-bold text-white">
                    {item.code}
                  </span>
                  <span className="text-xs muted">{item.duration}</span>
                  <span className="text-xs muted">· Nên cử {item.headcount}</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold">{item.shortTitle}</h3>
                <ul className="mt-3 space-y-1.5">
                  {item.reasons.map((r) => (
                    <li key={r} className="flex gap-2 text-sm muted">
                      <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {r}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/khoa-hoc/${item.slug}`} className="btn-outline !px-4 !py-2 text-xs">
                    Xem chi tiết
                  </Link>
                  <Link href={`/dang-ky?khoa=${item.code}`} className="btn-primary !px-4 !py-2 text-xs">
                    Đăng ký {courseName(item.code)}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {result.alternatives.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-bold">Có thể cân nhắc thêm</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {result.alternatives.map((item) => (
                <Link key={item.code} href={`/khoa-hoc/${item.slug}`} className="card !p-4">
                  <p className="font-mono text-xs muted">{item.code}</p>
                  <p className="mt-1 text-sm font-semibold">{item.shortTitle}</p>
                  <p className="mt-1.5 text-xs muted">{item.reasons[0]}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="rounded-lg border-l-2 border-accent-500 bg-accent-50 p-4 text-sm dark:bg-accent-900/20">
          {result.note}
        </p>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={restart} className="btn-outline">
            Chọn lại
          </button>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('aiedu:open-chat', {
                  detail: {
                    course: result.primary[0]?.code,
                    question: 'Tôi muốn tìm hiểu kỹ hơn về khóa được gợi ý',
                  },
                }),
              )
            }
            className="btn-outline"
          >
            Hỏi trợ lý thêm
          </button>
        </div>
      </div>
    )
  }

  const question = QUESTIONS[step]

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={QUESTIONS.length}>
        {QUESTIONS.map((q, i) => (
          <span
            key={q.key}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-500' : 'bg-[rgb(var(--border))]'}`}
          />
        ))}
      </div>
      <p className="mt-3 text-xs muted">
        Câu {step + 1} / {QUESTIONS.length}
      </p>

      <h2 className="mt-5 font-display text-xl font-bold">{question.title}</h2>

      <div className="mt-6 grid gap-2.5">
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => choose(option.value)}
            disabled={status === 'loading'}
            className="card text-left !py-4 transition hover:border-brand-500"
          >
            {option.label}
          </button>
        ))}
      </div>

      {step > 0 && (
        <button type="button" onClick={() => setStep(step - 1)} className="mt-5 text-sm muted hover:underline">
          ← Quay lại
        </button>
      )}

      {status === 'loading' && <p className="mt-5 text-sm muted">Đang tìm khóa phù hợp…</p>}
      {status === 'error' && (
        <p className="mt-5 text-sm text-red-600 dark:text-red-400">
          Chưa lấy được gợi ý. Anh/chị thử lại, hoặc xem trực tiếp{' '}
          <Link href="/khoa-hoc" className="underline">
            danh sách 08 khóa
          </Link>
          .
        </p>
      )}
    </div>
  )
}
