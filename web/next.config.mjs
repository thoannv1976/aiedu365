/*
 * Trình duyệt gọi API qua chính domain của web (`/api/*`). Việc chuyển tiếp do
 * route handler `src/app/api/[...path]/route.ts` đảm nhiệm, vì nó cần gắn thêm
 * ID token để gọi được service API đang ở chế độ không mở ra Internet — điều
 * mà `rewrites` không làm được.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}

export default nextConfig
