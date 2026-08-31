'use client'

import { courseName } from '@/lib/api'

/** Mở trợ lý kèm ngữ cảnh khóa đang xem, để bot không phải đoán người hỏi nói về khóa nào. */
export function AskAboutCourse({ code }: { code: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent('aiedu:open-chat', {
            detail: {
              course: code,
              question: `Cho tôi hỏi về ${courseName(code)}`,
            },
          }),
        )
      }
      className="btn-secondary"
    >
      Hỏi trợ lý về khóa này
    </button>
  )
}
