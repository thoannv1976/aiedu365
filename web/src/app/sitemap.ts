import type { MetadataRoute } from 'next'

import { getCourses } from '@/lib/api'
import { siteUrl } from '@/lib/siteUrl'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const courses = await getCourses()
  const now = new Date()

  const staticRoutes = [
    { path: '', priority: 1 },
    { path: '/khoa-hoc', priority: 0.9 },
    { path: '/chon-khoa-hoc', priority: 0.8 },
    { path: '/phan-mem-chuyen-giao', priority: 0.7 },
    { path: '/dang-ky', priority: 0.8 },
    { path: '/hoi-dap', priority: 0.6 },
  ]

  return [
    ...staticRoutes.map((r) => ({
      url: `${base}${r.path}`,
      lastModified: now,
      priority: r.priority,
    })),
    ...courses.map((c) => ({
      url: `${base}/khoa-hoc/${c.slug}`,
      lastModified: now,
      priority: 0.85,
    })),
  ]
}
