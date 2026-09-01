'use client'

import Link from 'next/link'

import { ErrorNotice, PageHeader, useAdminData } from '@/components/admin/Panels'
import { adminGet } from '@/lib/admin'
import { courseName } from '@/lib/api'
import type { Course } from '@/lib/types'

export default function CourseListAdminPage() {
  const { data, error, loading } = useAdminData<Course[]>(() => adminGet('/courses'))

  return (
    <>
      <PageHeader
        title="Khóa học"
        description="Sửa nội dung 08 khóa. Mã khóa, slug và số hiệu không đổi được — thay chúng sẽ phá các đường dẫn đã phát hành và bảng quy đổi mã khóa của chatbot."
      />

      {error && <ErrorNotice error={error} />}
      {loading && <p className="muted">Đang tải…</p>}

      <div className="space-y-2">
        {(data ?? []).map((course) => (
          <Link
            key={course.code}
            href={`/admin/khoa-hoc/${course.code}`}
            className={`group-${course.group} card flex flex-wrap items-center justify-between gap-3 !p-4 transition hover:border-brand-500`}
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2">
                <span className="group-accent-bar rounded px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
                  {course.code}
                </span>
                <span className="font-semibold">{course.shortTitle}</span>
                <span className="text-xs muted">(số {course.legacyNumber} trong thư mời)</span>
              </p>
              <p className="mt-1 text-sm muted">
                {course.duration} · {course.days.length} ngày nội dung ·{' '}
                {(course.software.modules ?? []).length} module ·{' '}
                {course.deliverables.length} kết quả đầu ra
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!course.published && (
                <span className="chip border-amber-500 text-[11px] text-amber-700 dark:text-amber-400">
                  đang ẩn
                </span>
              )}
              <span aria-hidden className="text-sm muted">
                Sửa →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
