import type { Metadata } from 'next'

import { RegistrationForm } from '@/components/sections/RegistrationForm'
import { ScheduleList } from '@/components/sections/ScheduleList'
import { getCourses, getSchedules, getSite } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Đăng ký tham dự',
  description:
    'Phiếu đăng ký tham dự các khóa tập huấn AI chuyên sâu. Một đơn vị có thể đăng ký nhiều khóa trong cùng một đợt.',
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ khoa?: string }>
}) {
  const { khoa } = await searchParams
  const [courses, site, schedules] = await Promise.all([getCourses(), getSite(), getSchedules()])
  const contact = site.contact

  return (
    <div className="section">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <p className="eyebrow">Đăng ký</p>
          <h1 className="heading mt-3">Phiếu đăng ký tham dự</h1>
          <p className="mt-4 max-w-prose muted">
            Một đơn vị có thể đăng ký nhiều khóa trong cùng một đợt. Ban tổ chức sẽ liên hệ xác nhận
            thời gian, địa điểm và các thông tin còn lại.
          </p>
          {schedules.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-bold">Các đợt sắp tới</h2>
              <div className="mt-4">
                <ScheduleList schedules={schedules} />
              </div>
            </section>
          )}

          <RegistrationForm courses={courses} preselected={khoa ?? null} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card">
            <p className="font-semibold">Đầu mối ban tổ chức</p>
            {contact.registrationDeadline && (
              <p className="mt-2 text-sm">
                <strong>Hạn đăng ký:</strong> {contact.registrationDeadline}
              </p>
            )}
            {contact.email || contact.phone || contact.unit ? (
              <ul className="mt-3 space-y-2 text-sm muted">
                {contact.unit ? <li>{contact.unit}</li> : null}
                {contact.email ? (
                  <li>
                    <a href={`mailto:${contact.email}`} className="hover:underline">
                      {contact.email}
                    </a>
                  </li>
                ) : null}
                {contact.phone ? (
                  <li>
                    <a href={`tel:${contact.phone}`} className="hover:underline">
                      {contact.phone}
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="mt-3 text-sm muted">{contact.note}</p>
            )}

            <hr className="my-4 border-[rgb(var(--border))]" />

            <p className="text-sm font-semibold">Nên cử nhóm bao nhiêu người?</p>
            <ul className="mt-2 space-y-1 text-xs muted">
              <li>Khóa 21: khoảng 03 người (Business – Process – Technology)</li>
              <li>Khóa 22, 23, 24, 27: 03–05 người</li>
              <li>Khóa 28: 03–06 người</li>
              <li>Khóa 25, 26: 05–10 người (dành cho Khoa/Bộ môn)</li>
            </ul>

            <hr className="my-4 border-[rgb(var(--border))]" />
            <p className="text-xs muted">
              Thông tin anh/chị cung cấp chỉ dùng để ban tổ chức liên hệ về chương trình tập huấn.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
