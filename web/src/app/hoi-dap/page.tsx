import type { Metadata } from 'next'
import Link from 'next/link'

import { AskAssistant } from '@/components/ui/AskAssistant'
import { getFaqs } from '@/lib/api'
import { serializeJsonLd } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: 'Hỏi đáp',
  description: 'Câu hỏi thường gặp về 08 khóa tập huấn AI chuyên sâu cho chuyển đổi số đại học.',
}

export default async function FaqPage() {
  const faqs = await getFaqs()
  const categories = Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  return (
    <div className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <div className="container-page max-w-3xl">
        <p className="eyebrow">Hỏi đáp</p>
        <h1 className="heading mt-3">Câu hỏi thường gặp</h1>
        <p className="mt-4 muted">
          {faqs.length} câu hỏi về chương trình. Không tìm thấy điều anh/chị cần? Trợ lý AI trả lời
          dựa trên nội dung 08 thư mời chính thức.
        </p>

        <div className="mt-8 space-y-10">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="font-display text-lg font-bold">{category}</h2>
              <div className="mt-4 divide-y rounded-xl border">
                {faqs
                  .filter((f) => f.category === category)
                  .map((faq) => (
                    <details key={faq.id} className="group px-5 py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                        {faq.question}
                        <span aria-hidden className="shrink-0 transition group-open:rotate-45">＋</span>
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed muted">{faq.answer}</p>
                      {faq.courseCodes.length > 0 && (
                        <p className="mt-3 flex flex-wrap gap-1.5">
                          {faq.courseCodes.map((code) => (
                            <Link
                              key={code}
                              href={`/khoa-hoc/${code}`}
                              className="chip border-[rgb(var(--border))] text-[11px] muted hover:border-brand-500"
                            >
                              Khóa {code.replace('K', '')}
                            </Link>
                          ))}
                        </p>
                      )}
                    </details>
                  ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-brand-500 p-6 text-center">
          <p className="font-display text-lg font-bold">Không thấy câu trả lời?</p>
          <p className="mt-2 text-sm muted">
            Trợ lý AI trả lời dựa trên nội dung thư mời và luôn dẫn nguồn.
          </p>
          <AskAssistant className="mt-5" label="Hỏi trợ lý AI" />
        </div>
      </div>
    </div>
  )
}
