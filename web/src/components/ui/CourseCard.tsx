'use client'

import Link from 'next/link'

import { courseName } from '@/lib/api'
import type { CourseGroup, CourseSummary } from '@/lib/types'

export function CourseCard({
  course,
  group,
  featured = false,
}: {
  course: CourseSummary
  group?: CourseGroup
  featured?: boolean
}) {
  const askAboutCourse = () => {
    window.dispatchEvent(
      new CustomEvent('aiedu:open-chat', {
        detail: {
          course: course.code,
          question: `${courseName(course.code)} phù hợp với đơn vị nào và nên cử bao nhiêu người?`,
        },
      }),
    )
  }

  return (
    <article
      className={`group-${course.group} card relative flex flex-col overflow-hidden !p-0 ${
        featured ? 'lg:col-span-2' : ''
      }`}
    >
      <div className="group-accent-bar h-1 w-full" aria-hidden />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="group-accent-bar rounded px-2 py-0.5 font-mono text-xs font-bold text-white">
            {course.code}
          </span>
          {group && (
            <span className="chip border-[rgb(var(--border))] text-[11px] muted">{group.shortName}</span>
          )}
          <span className="text-xs muted">{course.duration}</span>
        </div>

        <h3 className="mt-3 font-display text-lg font-bold leading-snug">
          <Link href={`/khoa-hoc/${course.slug}`} className="hover:underline">
            {course.shortTitle}
          </Link>
        </h3>
        <p className="mt-1.5 text-sm muted">{course.tagline}</p>

        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex gap-2">
            <dt className="min-w-24 shrink-0 text-xs uppercase tracking-wide muted">Đầu ra</dt>
            <dd>{course.outputSummary}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="min-w-24 shrink-0 text-xs uppercase tracking-wide muted">Nên cử</dt>
            <dd>{course.headcount}</dd>
          </div>
          {course.softwareName && (
            <div className="flex gap-2">
              <dt className="min-w-24 shrink-0 text-xs uppercase tracking-wide muted">Chuyển giao</dt>
              <dd>
                <span className="font-medium">{course.softwareName}</span>
                {course.moduleCount > 0 && (
                  <span className="muted"> · {course.moduleCount} module</span>
                )}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <Link href={`/khoa-hoc/${course.slug}`} className="btn-outline !px-4 !py-2 text-xs">
            Xem chi tiết
          </Link>
          <button type="button" onClick={askAboutCourse} className="btn !px-4 !py-2 text-xs muted hover:underline">
            Hỏi về khóa này →
          </button>
        </div>
      </div>
    </article>
  )
}
