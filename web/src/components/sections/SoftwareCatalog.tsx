'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import type { SoftwareGroup } from '@/lib/types'

/** Bỏ dấu để ô tìm kiếm hoạt động cả khi người dùng gõ không dấu. */
const fold = (text: string) =>
  text
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function SoftwareCatalog({ suites }: { suites: SoftwareGroup[] }) {
  const [active, setActive] = useState<string>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const needle = fold(query.trim())
    return suites
      .filter((s) => active === 'all' || s.courseCode === active)
      .map((s) => ({
        ...s,
        modules: needle
          ? s.modules.filter((m) => fold(`${m.name} ${m.description}`).includes(needle))
          : s.modules,
      }))
      .filter((s) => s.modules.length > 0)
  }, [suites, active, query])

  const matchCount = visible.reduce((sum, s) => sum + s.modules.length, 0)

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActive('all')}
            className={`chip border-[rgb(var(--border))] ${active === 'all' ? 'bg-ink-800 text-white' : ''}`}
          >
            Tất cả
          </button>
          {suites.map((s) => (
            <button
              key={s.courseCode}
              type="button"
              onClick={() => setActive(s.courseCode)}
              className={`chip border-[rgb(var(--border))] font-mono ${
                active === s.courseCode ? 'bg-ink-800 text-white' : ''
              }`}
            >
              {s.courseCode}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm module…"
          aria-label="Tìm module phần mềm"
          className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 sm:w-56"
        />
      </div>

      {query && (
        <p className="mt-4 text-sm muted">
          {matchCount === 0 ? 'Không có module nào khớp.' : `${matchCount} module khớp với “${query}”.`}
        </p>
      )}

      <div className="mt-8 space-y-10">
        {visible.map((suite) => (
          <section key={suite.courseCode} id={suite.courseCode} className="scroll-mt-24">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="rounded bg-ink-800 px-2.5 py-1 font-mono text-xs font-bold text-white">
                {suite.courseCode}
              </span>
              <h2 className="font-display text-xl font-bold">{suite.suiteName}</h2>
              <Link href={`/khoa-hoc/${suite.courseSlug}`} className="text-sm text-brand-600 hover:underline dark:text-brand-400">
                {suite.courseName} →
              </Link>
            </div>
            {suite.intro && <p className="mt-3 max-w-prose text-sm muted">{suite.intro}</p>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {suite.modules.map((m) => (
                <div key={m.no} className="card !p-4">
                  <p className="font-mono text-xs muted">{String(m.no).padStart(2, '0')}</p>
                  <h3 className="mt-1 text-sm font-semibold">{m.name}</h3>
                  <p className="mt-1.5 text-xs muted">{m.description}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
