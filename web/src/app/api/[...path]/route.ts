import { type NextRequest, NextResponse } from 'next/server'

/**
 * Cổng chuyển tiếp tới service API.
 *
 * Service API chạy ở chế độ `--no-allow-unauthenticated`, tức không mở ra
 * Internet. Chỉ service web gọi được, và phải kèm ID token do metadata server
 * của Cloud Run cấp. Nhờ vậy toàn bộ endpoint quản trị nằm sau hai lớp: IAM
 * của Cloud Run, rồi mới tới xác thực Firebase của chính ứng dụng.
 *
 * Hai lớp đó cùng dùng header `Authorization`, nên token quản trị của người
 * dùng được chuyển tiếp qua `X-Admin-Authorization` để không đè lên ID token.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const API_URL = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:8080'
const METADATA_URL =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity'

let cachedToken: { value: string; expiresAt: number } | null = null

/**
 * Lấy ID token để gọi service API.
 *
 * Chỉ có trên Cloud Run. Khi chạy cục bộ, metadata server không tồn tại nên
 * hàm trả về chuỗi rỗng và request đi thẳng — đúng với việc API cục bộ mở.
 */
async function getIdentityToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value

  try {
    const res = await fetch(`${METADATA_URL}?audience=${encodeURIComponent(API_URL)}`, {
      headers: { 'Metadata-Flavor': 'Google' },
      signal: AbortSignal.timeout(2000),
      cache: 'no-store',
    })
    if (!res.ok) return ''
    const token = await res.text()
    // Token sống 1 giờ; làm mới sớm 5 phút để không rơi vào khoảng hết hạn.
    cachedToken = { value: token, expiresAt: Date.now() + 55 * 60 * 1000 }
    return token
  } catch {
    return ''
  }
}

async function proxy(request: NextRequest, path: string[]): Promise<Response> {
  const target = `${API_URL}/api/${path.join('/')}${request.nextUrl.search}`

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  headers.set('accept', request.headers.get('accept') ?? '*/*')

  const clientIp =
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? ''
  if (clientIp) headers.set('x-forwarded-for', clientIp)

  const adminAuth = request.headers.get('authorization')
  if (adminAuth) headers.set('x-admin-authorization', adminAuth)

  const idToken = await getIdentityToken()
  if (idToken) headers.set('authorization', `Bearer ${idToken}`)

  const body =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text()

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      // Cần cho phản hồi dạng stream (SSE) của endpoint chat.
      // @ts-expect-error — tuỳ chọn của undici, không có trong kiểu chuẩn.
      duplex: 'half',
    })

    const responseHeaders = new Headers()
    for (const key of ['content-type', 'cache-control', 'content-disposition']) {
      const value = upstream.headers.get(key)
      if (value) responseHeaders.set(key, value)
    }
    // Tắt buffer để câu trả lời hiện dần theo token thay vì đổ ra một lần.
    responseHeaders.set('x-accel-buffering', 'no')

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('[api-proxy]', target, error)
    return NextResponse.json(
      { detail: 'Không kết nối được tới dịch vụ. Anh/chị thử lại sau ít phút.' },
      { status: 502 },
    )
  }
}

type Context = { params: Promise<{ path: string[] }> }

export async function GET(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path)
}

export async function POST(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path)
}

export async function PUT(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path)
}

export async function PATCH(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path)
}

export async function DELETE(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path)
}
