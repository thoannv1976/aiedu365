import Link from 'next/link'

import { courseName, formatDate, formatDateRange } from '@/lib/api'
import type { Schedule } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = {
  planned: 'Dự kiến',
  open: 'Đang nhận đăng ký',
  closed: 'Đã đóng đăng ký',
  done: 'Đã tổ chức',
}

/**
 * Danh sách đợt khai giảng.
 *
 * Khi ban tổ chức chưa nhập đợt nào, thành phần này nói thẳng là chưa có lịch
 * thay vì hiện khung rỗng — đúng với cách chatbot trả lời câu hỏi tương tự.
 */
export function ScheduleList({
  schedules,
  showCourse = true,
  emptyText = 'Ban tổ chức sẽ thông báo lịch khai giảng cụ thể. Anh/chị có thể đăng ký trước để được liên hệ khi có lịch.',
}: {
  schedules: Schedule[]
  showCourse?: boolean
  emptyText?: string
}) {
  if (schedules.length === 0) {
    return (
      <p className="rounded-lg border-l-2 border-[rgb(var(--border))] p-4 text-sm muted">
        {emptyText}
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {schedules.map((s) => (
        <li key={s.id} className="card !p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {showCourse && (
                <Link href={`/khoa-hoc/${s.courseCode}`} className="font-semibold hover:underline">
                  {courseName(s.courseCode)}
                </Link>
              )}
              <p className={showCourse ? 'mt-1 text-sm' : 'text-sm font-medium'}>
                {formatDateRange(s.startDate, s.endDate) || 'Chưa xác định ngày'}
                {s.location && <span className="muted"> · {s.location}</span>}
              </p>
              <p className="mt-1 text-xs muted">
                {s.format}
                {s.capacity ? ` · ${s.capacity} chỗ` : ''}
                {s.registrationDeadline
                  ? ` · hạn đăng ký ${formatDate(s.registrationDeadline)}`
                  : ''}
              </p>
              {(s.contactName || s.contactEmail || s.contactPhone) && (
                <p className="mt-1 text-xs muted">
                  Đầu mối: {s.contactName}
                  {s.contactEmail && (
                    <>
                      {' '}
                      · <a href={`mailto:${s.contactEmail}`} className="hover:underline">{s.contactEmail}</a>
                    </>
                  )}
                  {s.contactPhone && ` · ${s.contactPhone}`}
                </p>
              )}
            </div>
            <span className="chip border-[rgb(var(--border))] text-[11px] muted">
              {STATUS_LABELS[s.status] ?? s.status}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
