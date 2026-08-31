import type { Metadata } from 'next'

import { AdminShell } from '@/components/admin/AdminShell'

export const metadata: Metadata = {
  title: 'Quản trị · AIEDU365',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
