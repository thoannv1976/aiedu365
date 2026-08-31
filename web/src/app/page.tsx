import Link from 'next/link'

import { CountUp } from '@/components/ui/CountUp'
import { CourseCard } from '@/components/ui/CourseCard'
import { Reveal } from '@/components/ui/Reveal'
import { courseName, getCourses, getFaqs, getGroups, getSite, getSoftware } from '@/lib/api'

export default async function HomePage() {
  const [site, courses, groups, faqs, software] = await Promise.all([
    getSite(),
    getCourses(),
    getGroups(),
    getFaqs(),
    getSoftware(),
  ])

  const featured = courses.find((c) => c.featured)
  const rest = courses.filter((c) => !c.featured)
  const groupById = new Map(groups.map((g) => [g.id, g]))

  return (
    <>
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-ink-800 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 20%, #00a6ed55, transparent 45%), radial-gradient(circle at 82% 15%, #f5a52433, transparent 40%)',
          }}
        />
        <div className="container-page relative py-20 sm:py-24 lg:py-28">
          <p className="eyebrow !text-accent-400">{site.hero.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            {site.hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {site.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={site.hero.primaryCta.href} className="btn-primary">
              {site.hero.primaryCta.label}
            </Link>
            <Link href={site.hero.secondaryCta.href} className="btn-secondary">
              {site.hero.secondaryCta.label}
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/60">
            Mã khóa chính thức: Khóa 21 – Khóa 28, tương ứng khóa chuyên sâu số 1 – số 8 trong thư mời.
          </p>
        </div>
      </section>

      {/* 2. Dải số liệu */}
      <section className="border-b surface">
        <div className="container-page grid gap-px py-0 sm:grid-cols-3 lg:grid-cols-5">
          {site.stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 60} className="py-7 sm:px-4">
              <p className="font-display text-3xl font-bold text-ink-800 dark:text-brand-300">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-1 text-sm font-medium">{stat.label}</p>
              <p className="text-xs muted">{stat.note}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3. Vì sao khác biệt */}
      <section className="section">
        <div className="container-page">
          <p className="eyebrow">Vì sao khóa này khác biệt</p>
          <h2 className="heading mt-3 max-w-2xl">
            Kết thúc khóa học, đơn vị mang về sản phẩm — không chỉ kiến thức
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {site.differentiators.map((item, i) => (
              <Reveal key={item.title} delay={i * 70}>
                <div className="card h-full">
                  <p className="font-mono text-xs muted">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="mt-2 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm muted">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Chọn khóa phù hợp */}
      <section className="section bg-brand-50 dark:bg-brand-900/20">
        <div className="container-page grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow">Chưa biết chọn khóa nào?</p>
            <h2 className="heading mt-3">Trả lời 3 câu hỏi, nhận gợi ý khóa phù hợp</h2>
            <p className="mt-4 max-w-prose muted">
              Với 08 khóa trải trên nhiều lĩnh vực, chọn đúng khóa quan trọng hơn chọn nhiều khóa.
              Công cụ hỏi về nghiệp vụ của đơn vị, ưu tiên hiện tại và số người có thể cử, rồi đề
              xuất 1–2 khóa kèm lý do và số người nên cử.
            </p>
            <Link href="/chon-khoa-hoc" className="btn-primary mt-6">
              Bắt đầu chọn khóa
            </Link>
          </div>
          <ol className="space-y-3">
            {[
              'Đơn vị của anh/chị phụ trách mảng nào?',
              'Ưu tiên trước mắt là gì?',
              'Có thể cử bao nhiêu cán bộ tham dự?',
            ].map((q, i) => (
              <li key={q} className="card flex items-start gap-3 !py-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-800 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm">{q}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. 08 khóa tập huấn */}
      <section id="khoa-hoc" className="section">
        <div className="container-page">
          <p className="eyebrow">Khóa 21 – Khóa 28</p>
          <h2 className="heading mt-3">08 khóa tập huấn chuyên sâu</h2>
          <p className="mt-4 max-w-prose muted">
            Gom theo 05 nhóm để dễ tìm đúng khóa cho đơn vị mình. Khóa 21 là bản tổng quan 05 lĩnh
            vực trong 05 ngày; bảy khóa còn lại đi sâu 02 ngày cho từng nghiệp vụ.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/khoa-hoc?nhom=${g.id}`}
                className={`group-${g.id} chip border-[rgb(var(--border))] transition hover:border-current`}
              >
                <span className="group-accent-bar mr-2 h-2 w-2 rounded-full" aria-hidden />
                {g.name}
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {featured && <CourseCard course={featured} group={groupById.get(featured.group)} featured />}
            {rest.map((course) => (
              <CourseCard key={course.code} course={course} group={groupById.get(course.group)} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Lộ trình */}
      <section className="section surface border-y">
        <div className="container-page">
          <p className="eyebrow">Lộ trình</p>
          <h2 className="heading mt-3">Từ tập huấn đến nhân rộng</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {site.roadmap.map((step, i) => (
              <Reveal key={step.step} delay={i * 50}>
                <li className="relative h-full rounded-lg border-l-2 border-brand-500 pl-4">
                  <p className="font-mono text-xs muted">B{i + 1}</p>
                  <p className="mt-1 font-semibold">{step.step}</p>
                  <p className="mt-1 text-sm muted">{step.description}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 7. Phần mềm chuyển giao */}
      <section className="section">
        <div className="container-page">
          <p className="eyebrow">Chuyển giao miễn phí</p>
          <h2 className="heading mt-3">
            {software.reduce((sum, s) => sum + s.modules.length, 0)} module phần mềm AI
          </h2>
          <p className="mt-4 max-w-prose muted">
            Mỗi khóa chuyển giao một bộ phần mềm phiên bản triển khai thử nghiệm, kèm hướng dẫn cài
            đặt, cấu hình Knowledge Base và dữ liệu mẫu.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {software.map((suite) => (
              <Link
                key={suite.courseCode}
                href={`/phan-mem-chuyen-giao#${suite.courseCode}`}
                className={`group-${courses.find((c) => c.code === suite.courseCode)?.group ?? ''} card !p-5`}
              >
                <p className="group-accent-text font-mono text-xs font-bold">{suite.courseCode}</p>
                <p className="mt-2 text-sm font-semibold leading-snug">{suite.suiteName}</p>
                <p className="mt-2 text-xs muted">{suite.modules.length} module</p>
              </Link>
            ))}
          </div>
          <Link href="/phan-mem-chuyen-giao" className="btn-outline mt-8">
            Xem toàn bộ module
          </Link>
        </div>
      </section>

      {/* 8. Nên cử ai đi học */}
      <section className="section surface border-y">
        <div className="container-page">
          <p className="eyebrow">Đối tượng</p>
          <h2 className="heading mt-3">Nên cử ai đi học</h2>
          <p className="mt-4 max-w-prose muted">
            Điểm chung của cả 08 khóa: cử một nhóm gồm lãnh đạo, chuyên viên nghiệp vụ và cán bộ
            CNTT — để sản phẩm làm ra trong workshop có thể tiếp tục pilot tại đơn vị.
          </p>
          <div className="mt-8 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead className="surface">
                <tr>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide muted">Khóa</th>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide muted">Đối tượng</th>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide muted">Số người khuyến nghị</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.code}>
                    <td className="border-b px-4 py-3 align-top">
                      <Link href={`/khoa-hoc/${c.slug}`} className="font-semibold hover:underline">
                        {courseName(c.code)}
                      </Link>
                      <p className="text-xs muted">{c.shortTitle}</p>
                    </td>
                    <td className="border-b px-4 py-3 align-top text-xs muted">{c.recipients}</td>
                    <td className="whitespace-nowrap border-b px-4 py-3 align-top font-medium">
                      {c.headcount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 9 + 10. Kết quả cam kết và hiệu quả kỳ vọng */}
      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Kết quả đầu ra</p>
            <h2 className="heading mt-3">Mỗi đơn vị mang về</h2>
            <ul className="mt-6 space-y-3">
              {[
                'Danh mục 10–25 pain point có thể ứng dụng AI',
                '03–05 quy trình ưu tiên để tái thiết kế bằng AI',
                'Ít nhất 01 prototype AI Copilot của chính nghiệp vụ mình',
                '01 Knowledge Base mẫu từ tài liệu nội bộ',
                '01 danh mục dữ liệu và API cần tích hợp',
                '01 bộ KPI đánh giá hiệu quả pilot',
                '01 kế hoạch pilot 3–6 tháng',
                'Bộ phần mềm được chuyển giao miễn phí',
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-sm border-2 border-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Hiệu quả kỳ vọng khi pilot</p>
            <h2 className="heading mt-3">Chỉ số tham chiếu</h2>
            <div className="mt-6 space-y-3">
              {[
                { metric: 'Thời gian xử lý tác vụ lặp lại', target: 'giảm 30–50%' },
                { metric: 'Câu hỏi/tra cứu thủ công được AI hỗ trợ', target: '50–70%' },
                { metric: 'Thời gian tìm kiếm minh chứng (Khóa 22)', target: 'giảm 50%+' },
                { metric: 'Bài Writing/Speaking AI hỗ trợ chấm vòng đầu (Khóa 26)', target: '≥ 70%' },
                { metric: 'Workflow AI đưa vào pilot', target: '02–04 quy trình' },
              ].map((row) => (
                <div key={row.metric} className="card flex items-center justify-between gap-4 !py-4">
                  <span className="text-sm">{row.metric}</span>
                  <span className="whitespace-nowrap font-display font-bold text-brand-600 dark:text-brand-400">
                    {row.target}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg border-l-2 border-accent-500 bg-accent-50 p-4 text-sm dark:bg-accent-900/20">
              <strong>Lưu ý:</strong> {site.responsibleAi.kpiNote}
            </p>
          </div>
        </div>
      </section>

      {/* 11. AI có trách nhiệm */}
      <section className="section surface border-y">
        <div className="container-page">
          <p className="eyebrow">Nguyên tắc</p>
          <h2 className="heading mt-3">{site.responsibleAi.title}</h2>
          <p className="mt-4 max-w-prose muted">{site.responsibleAi.intro}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {site.responsibleAi.rules.map((rule) => (
              <div key={rule.courseCode} className="card !p-5">
                <p className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                  {courseName(rule.courseCode)}
                </p>
                <p className="mt-2 text-sm">{rule.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 13. Hỏi đáp */}
      <section className="section">
        <div className="container-page">
          <p className="eyebrow">Hỏi đáp</p>
          <h2 className="heading mt-3">Câu hỏi thường gặp</h2>
          <div className="mt-8 divide-y rounded-xl border">
            {faqs.slice(0, 8).map((faq) => (
              <details key={faq.id} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {faq.question}
                  <span aria-hidden className="shrink-0 transition group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-3 max-w-prose text-sm leading-relaxed muted">{faq.answer}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/hoi-dap" className="btn-outline">
              Xem tất cả câu hỏi
            </Link>
          </div>
        </div>
      </section>

      {/* 14. Đăng ký */}
      <section className="section bg-ink-800 text-white">
        <div className="container-page text-center">
          <h2 className="heading">Đăng ký tham dự</h2>
          <p className="mx-auto mt-4 max-w-prose text-white/80">
            Một đơn vị có thể đăng ký nhiều khóa trong cùng một đợt. Ban tổ chức sẽ liên hệ xác nhận
            thời gian, địa điểm và các thông tin còn lại.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/dang-ky" className="btn-primary">
              Điền phiếu đăng ký
            </Link>
            <Link href="/chon-khoa-hoc" className="btn-secondary">
              Chưa rõ chọn khóa nào?
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
