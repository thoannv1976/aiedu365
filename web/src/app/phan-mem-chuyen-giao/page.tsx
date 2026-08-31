import type { Metadata } from 'next'
import Link from 'next/link'

import { SoftwareCatalog } from '@/components/sections/SoftwareCatalog'
import { getSoftware } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Phần mềm chuyển giao miễn phí',
  description:
    'Toàn bộ module phần mềm AI được chuyển giao miễn phí cho các đơn vị tham dự 08 khóa tập huấn.',
}

export default async function SoftwarePage() {
  const suites = await getSoftware()
  const total = suites.reduce((sum, s) => sum + s.modules.length, 0)

  return (
    <div className="section">
      <div className="container-page">
        <p className="eyebrow">Chuyển giao miễn phí</p>
        <h1 className="heading mt-3">{total} module phần mềm AI</h1>
        <p className="mt-4 max-w-prose muted">
          Mỗi khóa chuyển giao một bộ phần mềm phiên bản triển khai thử nghiệm cho đơn vị tham dự,
          kèm hướng dẫn cài đặt, cấu hình Knowledge Base, cấu trúc dữ liệu mẫu và hướng dẫn tổ chức
          pilot.
        </p>
        <p className="mt-4 max-w-prose rounded-lg border-l-2 border-accent-500 bg-accent-50 p-4 text-sm dark:bg-accent-900/20">
          <strong>Lưu ý:</strong> phần mềm miễn phí trong khuôn khổ chương trình. Chi phí hạ tầng máy
          chủ, API/model AI thương mại hoặc dịch vụ bên thứ ba (nếu phát sinh) do đơn vị chủ động
          lựa chọn và cân đối.
        </p>

        <SoftwareCatalog suites={suites} />

        <div className="mt-14 rounded-xl border border-brand-500 p-6 text-center">
          <p className="font-display text-lg font-bold">Muốn nhận bộ phần mềm cho đơn vị mình?</p>
          <p className="mx-auto mt-2 max-w-prose text-sm muted">
            Việc chuyển giao đi kèm khóa tập huấn — đơn vị cử cán bộ tham dự sẽ được hướng dẫn cấu
            hình trực tiếp trên dữ liệu của mình.
          </p>
          <Link href="/dang-ky" className="btn-primary mt-5">
            Đăng ký tham dự
          </Link>
        </div>
      </div>
    </div>
  )
}
