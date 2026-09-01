'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { getToken, setToken } from '@/lib/admin'

type NavItem = { href: string; label: string; icon: string }

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Vận hành',
    items: [
      { href: '/admin', label: 'Bảng điều khiển', icon: '▤' },
      { href: '/admin/dang-ky', label: 'Đăng ký', icon: '✓' },
      { href: '/admin/hoi-thoai', label: 'Hội thoại', icon: '💬' },
    ],
  },
  {
    group: 'Nội dung',
    items: [
      { href: '/admin/khoa-hoc', label: 'Khóa học', icon: '▦' },
      { href: '/admin/lich-khai-giang', label: 'Lịch khai giảng', icon: '📅' },
      { href: '/admin/faq', label: 'Hỏi đáp', icon: '?' },
      { href: '/admin/noi-dung', label: 'Nội dung trang', icon: '✎' },
    ],
  },
  {
    group: 'Hệ thống',
    items: [
      { href: '/admin/knowledge-base', label: 'Knowledge Base', icon: '⚙' },
      { href: '/admin/cau-hinh', label: 'Cấu hình AI', icon: '◆' },
      { href: '/admin/nguoi-dung', label: 'Người dùng', icon: '☺' },
      { href: '/admin/nhat-ky', label: 'Nhật ký', icon: '≡' },
    ],
  },
]

const FLAT_NAV = NAV.flatMap((section) => section.items)

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [value, setValue] = useState('')

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setToken(value.trim())
          onSignedIn()
        }}
        className="w-full max-w-md rounded-xl border surface p-8 shadow-sm"
      >
        <p className="font-display text-xl font-bold">Khu vực quản trị</p>
        <p className="mt-2 text-sm muted">
          Dán Firebase ID token của tài khoản đã được cấp quyền. Máy chủ vẫn xác thực token,
          nên token sai sẽ bị từ chối.
        </p>
        <label htmlFor="token" className="mt-6 block text-sm font-medium">
          ID token
        </label>
        <textarea
          id="token"
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1.5 w-full resize-y rounded-lg border bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-brand-500"
          placeholder="eyJhbGciOi…"
        />
        <button type="submit" className="btn-primary mt-4 w-full">
          Vào quản trị
        </button>
      </form>
    </div>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    setAuthed(Boolean(getToken()))
    setReady(true)
  }, [])

  if (!ready) return null
  if (!authed) return <SignIn onSignedIn={() => setAuthed(true)} />

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r surface lg:block">
        <div className="sticky top-0 flex h-screen flex-col p-4">
          <Link href="/" className="flex items-center gap-2.5 px-2 py-2 font-display font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-800 text-xs font-bold text-white">
              AI
            </span>
            <span className="text-sm">AIEDU365</span>
          </Link>
          <p className="mt-1 px-2 text-[11px] uppercase tracking-wide muted">Quản trị</p>

          <nav className="mt-5 flex flex-col gap-5 overflow-y-auto">
            {NAV.map((section) => (
              <div key={section.group}>
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider muted">
                  {section.group}
                </p>
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const active =
                      item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                          active
                            ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                            : 'muted hover:text-[rgb(var(--text))]'
                        }`}
                      >
                        <span aria-hidden className="w-4 text-center">
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto space-y-2 pt-4">
            <Link href="/" className="block px-3 text-xs muted hover:underline">
              ← Về trang công khai
            </Link>
            <button
              type="button"
              onClick={() => {
                setToken('')
                setAuthed(false)
              }}
              className="px-3 text-xs muted hover:underline"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <nav className="flex gap-1 overflow-x-auto border-b surface px-4 py-2 lg:hidden">
          {FLAT_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs muted">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-5 sm:p-8">{children}</div>
      </div>
    </div>
  )
}
