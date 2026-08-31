'use client'

/**
 * Lớp gọi API quản trị.
 *
 * Xác thực bằng Firebase ID token. Ở môi trường chưa cấu hình Firebase, token
 * lấy từ biến môi trường dành cho phát triển để ban tổ chức vẫn xem được giao
 * diện — API vẫn từ chối nếu token không hợp lệ, nên đây không phải lỗ hổng.
 */

const TOKEN_KEY = 'aiedu-admin-token'

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setToken(token: string): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Trình duyệt chặn localStorage — người dùng phải nhập lại token mỗi phiên.
  }
}

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${getToken()}`,
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    let detail = `Lỗi ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail ?? detail
    } catch {
      // Phản hồi không phải JSON — giữ nguyên thông báo mặc định.
    }
    throw new AdminApiError(detail, res.status)
  }
  return (await res.json()) as T
}

export const adminGet = <T,>(path: string) => request<T>(path)
export const adminPost = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : '{}' })
export const adminPatch = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
export const adminPut = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) })

/**
 * Tải file đăng ký.
 *
 * Không dùng thẻ <a> trỏ thẳng tới endpoint: trình duyệt sẽ không gửi kèm
 * header Authorization và API sẽ trả 401. Thay vào đó tải bằng fetch có header,
 * rồi dựng blob để trình duyệt lưu file.
 */
export async function downloadLeadsCsv(): Promise<void> {
  const res = await fetch('/api/admin/leads/export', {
    headers: { authorization: `Bearer ${getToken()}` },
  })
  if (!res.ok) throw new AdminApiError(`Không tải được file (lỗi ${res.status})`, res.status)

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `dang-ky-aiedu365-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
