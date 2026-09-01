import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ScheduleList } from '@/components/sections/ScheduleList'
import { AskAboutCourse } from '@/components/ui/AskAboutCourse'
import { courseName, getCourse, getCourses, getSchedules } from '@/lib/api'
import { serializeJsonLd } from '@/lib/jsonld'

export const revalidate = 60

export async function generateStaticParams() {
  const courses = await getCourses()
  return courses.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourse(slug)
  if (!course) return { title: 'Không tìm thấy khóa học' }
  return {
    title: `${courseName(course.code)} · ${course.shortTitle}`,
    description: course.intro[0]?.slice(0, 180) ?? course.tagline,
    openGraph: { title: course.title, description: course.tagline },
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const course = await getCourse(slug)
  if (!course) notFound()

  const schedules = await getSchedules(course.code)
  const name = courseName(course.code)
  const modules = course.software.modules ?? []

  // JSON-LD giúp Google hiểu đây là một khóa học, hiện rich result khi tìm kiếm.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.intro[0] ?? course.tagline,
    inLanguage: 'vi',
    courseCode: course.code,
    teaches: course.deliverables.slice(0, 5),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'onsite',
      courseWorkload: `P${course.durationDays}D`,
    },
  }

  return (
    <article className={`group-${course.group}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <header className="border-b bg-ink-800 text-white">
        <div className="container-page py-14 sm:py-16">
          <nav aria-label="Đường dẫn" className="text-xs text-white/60">
            <Link href="/khoa-hoc" className="hover:underline">
              Khóa học
            </Link>
            <span aria-hidden> / </span>
            <span>{name}</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded bg-accent-500 px-2.5 py-1 font-mono text-xs font-bold text-ink-800">
              {course.code}
            </span>
            <span className="text-sm text-white/70">
              Khóa tập huấn chuyên sâu số {course.legacyNumber} trong thư mời
            </span>
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 text-lg text-accent-300">{course.tagline}</p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Thời lượng', value: course.duration },
              { label: 'Phương pháp', value: course.method },
              { label: 'Đầu ra', value: course.outputSummary },
              { label: 'Nên cử', value: course.audience.headcount ?? '' },
            ]
              .filter((x) => x.value)
              .map((item) => (
                <div key={item.label} className="rounded-lg bg-white/10 p-4">
                  <dt className="text-xs uppercase tracking-wide text-white/60">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold">{item.value}</dd>
                </div>
              ))}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/dang-ky?khoa=${course.code}`} className="btn-primary">
              Đăng ký khóa này
            </Link>
            <AskAboutCourse code={course.code} />
          </div>
        </div>
      </header>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1fr_300px] lg:gap-16">
        <div className="min-w-0 space-y-14">
          <section>
            <p className="text-sm font-medium">
              <span className="muted">Kính gửi: </span>
              {course.recipients}
            </p>
            <div className="prose-vi mt-5">
              {course.intro.map((paragraph, i) => (
                <p key={i} className="muted">
                  {paragraph}
                </p>
              ))}
            </div>
            {course.highlight?.text && (
              <p className="mt-5 rounded-lg border-l-2 border-accent-500 bg-accent-50 p-4 text-sm dark:bg-accent-900/20">
                <strong>{course.highlight.label}: </strong>
                {course.highlight.text}
              </p>
            )}
          </section>

          {course.values.length > 0 && (
            <section>
              <h2 className="heading">Giá trị thu được</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {course.values.map((v) => (
                  <div key={v.title} className="card !p-5">
                    <h3 className="font-semibold">{v.title}</h3>
                    <p className="mt-2 text-sm muted">{v.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {course.objectives.length > 0 && (
            <section>
              <h2 className="heading">Mục tiêu trọng tâm</h2>
              <ul className="mt-6 space-y-2">
                {course.objectives.map((o) => (
                  <li key={o} className="flex gap-3 text-sm">
                    <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-sm border-2 border-brand-500" />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section id="noi-dung-tap-huan">
            <h2 className="heading">Nội dung tập huấn</h2>
            <div className="mt-6 space-y-6">
              {course.days.map((day) => (
                <div key={day.no} className="card">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="group-accent-bar rounded px-2.5 py-1 text-xs font-bold text-white">
                      NGÀY {day.no}
                    </span>
                    <h3 className="font-display text-lg font-bold">{day.title}</h3>
                  </div>
                  {day.subtitle && <p className="mt-2 text-sm italic muted">{day.subtitle}</p>}
                  <ul className="mt-4 space-y-2">
                    {day.topics.map((topic, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                  {day.output && (
                    <p className="mt-4 rounded-lg border-l-2 border-emerald-500 bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">
                      <strong>Kết quả đầu ra: </strong>
                      {day.output}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="heading">Đối tượng nên cử đi học</h2>
            {course.audience.note && <p className="mt-4 max-w-prose muted">{course.audience.note}</p>}
            <div className="mt-6 overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead className="surface">
                  <tr>
                    <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide muted">Thành phần</th>
                    <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide muted">Vai trò trong khóa học</th>
                  </tr>
                </thead>
                <tbody>
                  {(course.audience.rows ?? []).map((row) => (
                    <tr key={row.role}>
                      <td className="border-b px-4 py-3 align-top font-medium">{row.role}</td>
                      <td className="border-b px-4 py-3 align-top muted">{row.duty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {course.audience.priorityUnits && (
              <p className="mt-4 text-sm muted">
                <strong>Đơn vị ưu tiên: </strong>
                {course.audience.priorityUnits}
              </p>
            )}
          </section>

          <section>
            <h2 className="heading">Kết quả đầu ra mang về</h2>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {course.deliverables.map((d) => (
                <li key={d} className="flex gap-3 text-sm">
                  <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-sm border-2 border-emerald-600" />
                  {d}
                </li>
              ))}
            </ul>
          </section>

          {modules.length > 0 && (
            <section id="phan-mem">
              <h2 className="heading">Phần mềm chuyển giao miễn phí</h2>
              <p className="mt-2 font-semibold text-brand-600 dark:text-brand-400">
                {course.software.name} · {modules.length} module
              </p>
              {course.software.intro && <p className="mt-3 max-w-prose muted">{course.software.intro}</p>}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {modules.map((m) => (
                  <div key={m.no} className="card !p-4">
                    <p className="font-mono text-xs muted">{String(m.no).padStart(2, '0')}</p>
                    <h3 className="mt-1 text-sm font-semibold">{m.name}</h3>
                    <p className="mt-1.5 text-xs muted">{m.description}</p>
                  </div>
                ))}
              </div>
              {course.software.scope && (
                <p className="mt-5 text-sm muted">
                  <strong>Phạm vi chuyển giao: </strong>
                  {course.software.scope}
                </p>
              )}
              {course.software.note && (
                <p className="mt-3 rounded-lg border-l-2 border-accent-500 bg-accent-50 p-4 text-sm dark:bg-accent-900/20">
                  {course.software.note}
                </p>
              )}
            </section>
          )}

          {(course.kpis.rows ?? []).length > 0 && (
            <section>
              <h2 className="heading">Hiệu quả kỳ vọng khi pilot</h2>
              {course.kpis.note && <p className="mt-3 max-w-prose muted">{course.kpis.note}</p>}
              <div className="mt-6 overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[460px] border-collapse text-sm">
                  <thead className="surface">
                    <tr>
                      <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide muted">Chỉ số tham chiếu</th>
                      <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide muted">Mục tiêu pilot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(course.kpis.rows ?? []).map((row) => (
                      <tr key={row.metric}>
                        <td className="border-b px-4 py-3 align-top">{row.metric}</td>
                        <td className="border-b px-4 py-3 align-top font-medium">{row.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {course.kpis.caveat && (
                <p className="mt-4 rounded-lg border-l-2 border-accent-500 bg-accent-50 p-4 text-sm dark:bg-accent-900/20">
                  <strong>Lưu ý: </strong>
                  {course.kpis.caveat}
                </p>
              )}
            </section>
          )}

          {course.responsibleAi.length > 0 && (
            <section>
              <h2 className="heading">Nguyên tắc sử dụng AI có trách nhiệm</h2>
              <ul className="mt-6 space-y-3">
                {course.responsibleAi.map((rule) => (
                  <li key={rule} className="rounded-lg border-l-2 border-red-500 bg-red-50 p-4 text-sm dark:bg-red-900/20">
                    {rule}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="heading">Dữ liệu khuyến khích mang theo</h2>
            <p className="mt-3 max-w-prose muted">
              70% thời lượng là workshop trên dữ liệu thật, nên việc chuẩn bị quyết định chất lượng
              sản phẩm mang về. Dữ liệu có thông tin cá nhân cần được ẩn danh trước khi sử dụng.
            </p>
            <ul className="mt-6 space-y-2">
              {course.dataToBring.map((d) => (
                <li key={d} className="flex gap-3 text-sm">
                  <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-sm border-2 border-brand-500" />
                  {d}
                </li>
              ))}
            </ul>
          </section>

          {course.relatedCourses.length > 0 && (
            <section>
              <h2 className="heading">So với các khóa khác</h2>
              <div className="mt-6 space-y-3">
                {course.relatedCourses.map((rel) => (
                  <Link
                    key={rel.code}
                    href={`/khoa-hoc/${rel.code}`}
                    className="card block transition hover:border-brand-500"
                  >
                    <p className="font-semibold">{courseName(rel.code)}</p>
                    <p className="mt-2 text-sm muted">{rel.reason}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wide muted">Trong khóa này</p>
            <nav className="mt-3 space-y-2 text-sm">
              {[
                { href: '#noi-dung-tap-huan', label: 'Nội dung tập huấn' },
                { href: '#phan-mem', label: 'Phần mềm chuyển giao' },
              ].map((item) => (
                <a key={item.href} href={item.href} className="block muted hover:text-[rgb(var(--text))]">
                  {item.label}
                </a>
              ))}
            </nav>
            <hr className="my-4 border-[rgb(var(--border))]" />
            <p className="text-sm">
              <strong>Lộ trình sau khóa học</strong>
            </p>
            <ol className="mt-2 space-y-1 text-xs muted">
              {course.roadmap.map((step, i) => (
                <li key={step}>
                  {i + 1}. {step}
                </li>
              ))}
            </ol>
            <Link href={`/dang-ky?khoa=${course.code}`} className="btn-primary mt-5 w-full">
              Đăng ký khóa này
            </Link>
          </div>

          <div className="card mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide muted">Lịch khai giảng</p>
            <div className="mt-3">
              <ScheduleList
                schedules={schedules}
                showCourse={false}
                emptyText="Ban tổ chức sẽ thông báo lịch cụ thể."
              />
            </div>
          </div>

          {course.motto && (
            <p className="mt-4 rounded-xl border-l-2 border-accent-500 p-4 text-sm italic muted">
              {course.motto}
            </p>
          )}
        </aside>
      </div>
    </article>
  )
}
