'use client'

import { usePathname } from 'next/navigation'

/**
 * Bọc phần khung chỉ dành cho trang công khai.
 *
 * Khu quản trị có khung riêng: không hiện footer và không hiện trợ lý tư vấn —
 * ban tổ chức đang làm việc với dữ liệu, không phải đang tìm hiểu khóa học.
 */
export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return <>{children}</>
}
