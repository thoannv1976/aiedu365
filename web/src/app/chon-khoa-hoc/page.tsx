import type { Metadata } from 'next'

import { CoursePicker } from '@/components/sections/CoursePicker'

export const metadata: Metadata = {
  title: 'Chọn khóa phù hợp',
  description:
    'Trả lời 3 câu hỏi để nhận gợi ý khóa tập huấn AI phù hợp với đơn vị của anh/chị, kèm lý do và số người nên cử.',
}

export default function PickerPage() {
  return (
    <div className="section">
      <div className="container-page max-w-3xl">
        <p className="eyebrow">Công cụ gợi ý</p>
        <h1 className="heading mt-3">Chọn khóa phù hợp với đơn vị</h1>
        <p className="mt-4 muted">
          Với 08 khóa trải trên nhiều lĩnh vực, chọn đúng khóa quan trọng hơn chọn nhiều khóa. Gợi ý
          dưới đây dựa trên nghiệp vụ, ưu tiên và quy mô đoàn — không phải quyết định thay anh/chị.
        </p>
        <CoursePicker />
      </div>
    </div>
  )
}
