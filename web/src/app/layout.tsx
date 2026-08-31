import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'

import { ChatWidget } from '@/components/chat/ChatWidget'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { getSite } from '@/lib/api'

import './globals.css'

const beVietnam = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-be-vietnam',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aiedu365.example'),
  title: {
    default: 'Tập huấn AI chuyên sâu cho Chuyển đổi số Đại học',
    template: '%s · AIEDU365',
  },
  description:
    '08 khóa tập huấn AI chuyên sâu (Khóa 21 – Khóa 28) cho các cơ sở giáo dục đại học. ' +
    '70% workshop trên dữ liệu thật, chuyển giao miễn phí phần mềm, có KPI và kế hoạch pilot 3–6 tháng.',
  keywords: [
    'tập huấn AI', 'chuyển đổi số đại học', 'AI trong giáo dục',
    'đảm bảo chất lượng', 'quản lý đào tạo', 'quản lý khoa học',
  ],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    title: 'Tập huấn AI chuyên sâu cho Chuyển đổi số Đại học',
    description: '08 khóa tập huấn, 19 ngày, chuyển giao miễn phí phần mềm AI.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#070f1c' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite()

  return (
    <html lang="vi" className={beVietnam.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('aiedu-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        <a
          href="#noi-dung"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-ink-800"
        >
          Bỏ qua điều hướng
        </a>
        <SiteHeader />
        <main id="noi-dung" className="flex-1">
          {children}
        </main>
        <SiteFooter site={site} />
        <ChatWidget greeting={site.chat.greeting} suggestions={site.chat.suggestions} />
      </body>
    </html>
  )
}
