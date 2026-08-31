'use client'

import { ErrorNotice, PageHeader, useAdminData } from '@/components/admin/Panels'
import { adminGet } from '@/lib/admin'

type AuditLog = {
  id: string
  actor: string
  action: string
  target: string
  at: string
}

const ACTION_LABELS: Record<string, string> = {
  'kb.reindex': 'Cập nhật Knowledge Base',
  'config.update': 'Sửa cấu hình AI',
  'prompt.update': 'Sửa system prompt',
  'lead.update': 'Cập nhật đăng ký',
  'faq.create_from_conversation': 'Tạo FAQ từ hội thoại',
}

export default function AuditLogPage() {
  const { data, error, loading } = useAdminData<AuditLog[]>(() => adminGet('/audit-logs'))

  return (
    <>
      <PageHeader
        title="Nhật ký kiểm toán"
        description="Mọi thay đổi trong khu quản trị đều được ghi lại: ai làm, làm gì, lúc nào. Bản ghi không sửa hay xóa được."
      />

      {error && <ErrorNotice error={error} />}
      {loading && <p className="muted">Đang tải…</p>}
      {data && data.length === 0 && <p className="muted">Chưa có thao tác nào được ghi nhận.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead className="surface">
              <tr>
                <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide muted">Thời điểm</th>
                <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide muted">Người thực hiện</th>
                <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide muted">Thao tác</th>
                <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide muted">Đối tượng</th>
              </tr>
            </thead>
            <tbody>
              {data.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap border-b px-4 py-3 align-top text-xs muted">
                    {new Date(log.at).toLocaleString('vi-VN')}
                  </td>
                  <td className="border-b px-4 py-3 align-top">{log.actor}</td>
                  <td className="border-b px-4 py-3 align-top">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </td>
                  <td className="border-b px-4 py-3 align-top font-mono text-xs muted">{log.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
