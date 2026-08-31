import Link from 'next/link'

import type { SiteContent } from '@/lib/types'

export function SiteFooter({ site }: { site: SiteContent }) {
  const contact = site.contact
  const hasContact = Boolean(contact.email || contact.phone || contact.unit)

  return (
    <footer className="border-t surface">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="font-display text-lg font-bold">AIEDU365</p>
          <p className="mt-2 max-w-md text-sm muted">{site.programName}</p>
          {site.organizer ? (
            <p className="mt-3 text-sm font-medium">Đơn vị tổ chức: {site.organizer}</p>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold">Nội dung</p>
          <ul className="mt-3 space-y-2 text-sm muted">
            <li><Link href="/khoa-hoc" className="hover:underline">08 khóa tập huấn</Link></li>
            <li><Link href="/chon-khoa-hoc" className="hover:underline">Chọn khóa phù hợp</Link></li>
            <li><Link href="/phan-mem-chuyen-giao" className="hover:underline">Phần mềm chuyển giao</Link></li>
            <li><Link href="/hoi-dap" className="hover:underline">Hỏi đáp</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Liên hệ</p>
          {hasContact ? (
            <ul className="mt-3 space-y-2 text-sm muted">
              {contact.unit ? <li>{contact.unit}</li> : null}
              {contact.address ? <li>{contact.address}</li> : null}
              {contact.email ? (
                <li><a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a></li>
              ) : null}
              {contact.phone ? (
                <li><a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a></li>
              ) : null}
            </ul>
          ) : (
            <p className="mt-3 text-sm muted">{contact.note || 'Ban tổ chức sẽ cập nhật thông tin liên hệ.'}</p>
          )}
          <Link href="/dang-ky" className="btn-primary mt-4 !px-4 !py-2 text-xs">
            Đăng ký tham dự
          </Link>
        </div>
      </div>

      <div className="border-t surface">
        <div className="container-page flex flex-col gap-2 py-5 text-xs muted sm:flex-row sm:items-center sm:justify-between">
          <p>Mã khóa chính thức: Khóa 21 – Khóa 28 (tương ứng khóa chuyên sâu số 1 – số 8 trong thư mời).</p>
          <p>Nội dung trên trang trích từ thư mời chính thức của chương trình.</p>
        </div>
      </div>
    </footer>
  )
}
