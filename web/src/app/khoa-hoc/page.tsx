import type { Metadata } from 'next'
import Link from 'next/link'

import { CourseCard } from '@/components/ui/CourseCard'
import { getCourses, getGroups } from '@/lib/api'

export const metadata: Metadata = {
  title: '08 khóa tập huấn',
  description:
    'Danh sách 08 khóa tập huấn AI chuyên sâu (Khóa 21 – Khóa 28) cho các cơ sở giáo dục đại học, lọc theo nhóm nghiệp vụ.',
}

export default async function CourseListPage({
  searchParams,
}: {
  searchParams: Promise<{ nhom?: string }>
}) {
  const { nhom } = await searchParams
  const [courses, groups] = await Promise.all([getCourses(), getGroups()])
  const groupById = new Map(groups.map((g) => [g.id, g]))
  const active = nhom && groupById.has(nhom) ? nhom : null
  const visible = active ? courses.filter((c) => c.group === active) : courses

  return (
    <div className="section">
      <div className="container-page">
        <p className="eyebrow">Khóa 21 – Khóa 28</p>
        <h1 className="heading mt-3">08 khóa tập huấn chuyên sâu</h1>
        <p className="mt-4 max-w-prose muted">
          Tổng cộng 19 ngày tập huấn. Mỗi khóa chuyển giao miễn phí một bộ phần mềm phiên bản triển
          khai thử nghiệm. Mã chính thức là Khóa 21 – Khóa 28, tương ứng khóa chuyên sâu số 1 – số 8
          trong thư mời.
        </p>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Lọc theo nhóm">
          <Link
            href="/khoa-hoc"
            className={`chip border-[rgb(var(--border))] ${!active ? 'bg-ink-800 text-white' : ''}`}
          >
            Tất cả ({courses.length})
          </Link>
          {groups.map((g) => {
            const count = courses.filter((c) => c.group === g.id).length
            const isActive = active === g.id
            return (
              <Link
                key={g.id}
                href={`/khoa-hoc?nhom=${g.id}`}
                className={`group-${g.id} chip border-[rgb(var(--border))] ${
                  isActive ? 'group-accent-bar text-white' : ''
                }`}
              >
                {g.name} ({count})
              </Link>
            )
          })}
        </nav>

        {active && (
          <p className="mt-5 rounded-lg border-l-2 border-brand-500 bg-brand-50 p-4 text-sm dark:bg-brand-900/20">
            <strong>{groupById.get(active)!.name}:</strong> {groupById.get(active)!.description}{' '}
            <span className="muted">Đơn vị mục tiêu: {groupById.get(active)!.targetUnits}.</span>
          </p>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {visible.map((course) => (
            <CourseCard key={course.code} course={course} group={groupById.get(course.group)} />
          ))}
        </div>

        {visible.length === 0 && (
          <p className="mt-10 text-center muted">Chưa có khóa nào trong nhóm này.</p>
        )}
      </div>
    </div>
  )
}
