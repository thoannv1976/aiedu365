'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/khoa-hoc', label: 'Khóa học' },
  { href: '/chon-khoa-hoc', label: 'Chọn khóa phù hợp' },
  { href: '/phan-mem-chuyen-giao', label: 'Phần mềm chuyển giao' },
  { href: '/hoi-dap', label: 'Hỏi đáp' },
]

function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('aiedu-theme', next ? 'dark' : 'light')
    } catch {
      // Trình duyệt chặn localStorage (chế độ riêng tư) — giao diện vẫn đổi được.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      className="rounded-lg border surface p-2 text-sm transition hover:border-brand-500"
    >
      <span aria-hidden>{dark ? '☀' : '☾'}</span>
    </button>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (pathname?.startsWith('/admin')) return null

  return (
    <header className="sticky top-0 z-40 border-b surface/95 backdrop-blur supports-[backdrop-filter]:bg-[rgb(var(--surface))]/80">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-display font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink-800 text-sm font-bold text-white">
            AI
          </span>
          <span className="leading-tight">
            <span className="block text-sm">AIEDU365</span>
            <span className="block text-[11px] font-normal muted">Tập huấn AI đại học</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'muted hover:text-[rgb(var(--text))]'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/dang-ky" className="btn-primary hidden !px-4 !py-2 sm:inline-flex">
            Đăng ký
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Mở menu"
            className="rounded-lg border surface p-2 lg:hidden"
          >
            <span aria-hidden>{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t surface lg:hidden" aria-label="Điều hướng di động">
          <div className="container-page flex flex-col py-2">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="py-3 text-sm font-medium">
                {item.label}
              </Link>
            ))}
            <Link href="/dang-ky" className="btn-primary my-3">
              Đăng ký tham dự
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
