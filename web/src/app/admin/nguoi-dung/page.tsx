'use client'

import { useState } from 'react'

import { Field } from '@/components/admin/SaveBar'
import { ErrorNotice, PageHeader, useAdminData } from '@/components/admin/Panels'
import { adminDelete, adminGet, adminPost } from '@/lib/admin'

type UsersResponse = {
  users: { id: string; email: string; role: string; displayName: string; active: boolean }[]
  bootstrapEmails: string[]
  currentUser: { email: string; role: string }
}

const ROLES = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Chỉ xem bảng điều khiển và danh sách đăng ký.',
  },
  {
    value: 'editor',
    label: 'Editor',
    description: 'Sửa nội dung, Knowledge Base, FAQ, cập nhật trạng thái đăng ký.',
  },
  {
    value: 'super_admin',
    label: 'Super Admin',
    description: 'Toàn quyền, gồm cả cấu hình AI, system prompt và quản lý người dùng.',
  },
]

export default function UsersPage() {
  const { data, error, loading, reload } = useAdminData<UsersResponse>(() => adminGet('/users'))
  const [form, setForm] = useState({ email: '', displayName: '', role: 'viewer' })
  const [notice, setNotice] = useState('')

  const run = async (action: () => Promise<{ message?: string }>) => {
    try {
      const res = await action()
      setNotice(res.message ?? 'Đã lưu.')
      reload()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Thao tác thất bại.')
    }
  }

  if (error) return <ErrorNotice error={error} />

  return (
    <>
      <PageHeader
        title="Người dùng quản trị"
        description="Cấp quyền vào khu quản trị. Ba mức quyền, tăng dần."
      />

      {notice && (
        <p className="mb-5 rounded-lg border-l-2 border-brand-500 bg-brand-50 p-3 text-sm dark:bg-brand-900/20">
          {notice}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {ROLES.map((role) => (
          <div key={role.value} className="card !p-4">
            <p className="font-semibold">{role.label}</p>
            <p className="mt-1.5 text-sm muted">{role.description}</p>
          </div>
        ))}
      </div>

      <section className="card mt-8">
        <h2 className="font-display text-lg font-bold">Thêm người dùng</h2>
        <p className="mt-1 text-sm muted">
          Sau khi thêm ở đây, người đó còn cần được gán custom claim <code className="rounded bg-black/5 px-1 dark:bg-white/10">role</code>{' '}
          trong Firebase Authentication thì mới đăng nhập được. Hai bước là cố ý: danh sách ở đây
          không tự cấp quyền, nó chỉ ghi nhận ai nên có quyền gì.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Tên hiển thị" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} />
          <div>
            <label htmlFor="u-role" className="block text-sm font-medium">
              Vai trò
            </label>
            <select
              id="u-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="mt-1.5 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={() => run(() => adminPost('/users', form))}
          disabled={!form.email.includes('@')}
          className="btn-primary mt-4 !px-4 !py-2 text-sm"
        >
          Thêm người dùng
        </button>
      </section>

      {loading && <p className="mt-6 muted">Đang tải…</p>}

      {data && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold">Danh sách</h2>

          {data.bootstrapEmails.length > 0 && (
            <p className="mt-3 rounded-lg border-l-2 border-[rgb(var(--border))] p-3 text-sm muted">
              Tài khoản khởi tạo (từ cấu hình <code className="rounded bg-black/5 px-1 dark:bg-white/10">ADMIN_EMAILS</code>),
              luôn có quyền Super Admin: {data.bootstrapEmails.join(', ')}
            </p>
          )}

          <div className="mt-4 space-y-2">
            {data.users.length === 0 && <p className="text-sm muted">Chưa thêm người dùng nào.</p>}
            {data.users.map((user) => (
              <div key={user.id} className="card flex flex-wrap items-center justify-between gap-3 !p-4">
                <div>
                  <p className="font-medium">
                    {user.displayName || user.email}
                    {user.email === data.currentUser.email && (
                      <span className="ml-2 text-xs muted">(bạn)</span>
                    )}
                  </p>
                  {user.displayName && <p className="text-sm muted">{user.email}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="chip border-[rgb(var(--border))] text-[11px] muted">
                    {ROLES.find((r) => r.value === user.role)?.label ?? user.role}
                  </span>
                  {!user.active && (
                    <span className="chip border-amber-500 text-[11px] text-amber-700 dark:text-amber-400">
                      đã vô hiệu hóa
                    </span>
                  )}
                  {user.active && user.email !== data.currentUser.email && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Vô hiệu hóa quyền của ${user.email}?`))
                          run(() => adminDelete(`/users/${encodeURIComponent(user.email)}`))
                      }}
                      className="text-xs text-red-600 hover:underline dark:text-red-400"
                    >
                      Vô hiệu hóa
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
