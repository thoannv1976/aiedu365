/**
 * Lớp gọi API. Trang tĩnh dựng sẵn ở build time dùng ISR để nội dung admin
 * sửa trên Firestore lan tới trang trong vòng một phút mà không cần deploy lại.
 */
import type {
  Course,
  CourseGroup,
  CourseSummary,
  Faq,
  Schedule,
  SiteContent,
  SoftwareGroup,
} from './types'

/** Gọi từ server: đi thẳng tới service API bằng URL nội bộ. */
const API_BASE = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:8080'
const REVALIDATE = 60

/**
 * Gọi từ trình duyệt: dùng đường dẫn tương đối, Next chuyển tiếp sang service
 * API qua rewrite trong ``next.config.mjs``. Không CORS, không lộ URL nội bộ.
 */
export const apiBase = ''

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}/api${path}`, { next: { revalidate: REVALIDATE } })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return (await res.json()) as T
  } catch (error) {
    // Không để một API tạm thời không phản hồi làm sập cả trang: trả về giá trị
    // mặc định và ghi log ở phía server.
    console.error(`[api] Không lấy được ${path}:`, error)
    return fallback
  }
}

export const getCourses = () => getJson<CourseSummary[]>('/courses', [])
export const getGroups = () => getJson<CourseGroup[]>('/groups', [])
export const getFaqs = () => getJson<Faq[]>('/faqs', [])
export const getSoftware = () => getJson<SoftwareGroup[]>('/software', [])

/** Lịch khai giảng đã công bố. Rỗng khi ban tổ chức chưa nhập đợt nào. */
export const getSchedules = (course?: string) =>
  getJson<Schedule[]>(`/schedules${course ? `?course=${course}` : ''}`, [])

/** Ngày dạng 2026-10-15 → 15/10/2026. Chuỗi rỗng hoặc sai định dạng giữ nguyên. */
export function formatDate(value: string): string {
  if (!value) return ''
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

/** "15/10/2026 → 16/10/2026", gộp lại nếu cùng ngày. */
export function formatDateRange(start: string, end: string): string {
  const from = formatDate(start)
  const to = formatDate(end)
  if (!from) return to
  if (!to || to === from) return from
  return `${from} → ${to}`
}

export const getSite = () =>
  getJson<SiteContent & { stats_computed?: unknown }>('/site', {
    programName: 'Chương trình tập huấn AI chuyên sâu cho Chuyển đổi số Đại học',
    organizer: '',
    hero: {
      eyebrow: '',
      title: 'Chương trình tập huấn AI chuyên sâu cho Chuyển đổi số Đại học',
      subtitle: '',
      primaryCta: { label: 'Chọn khóa phù hợp', href: '/chon-khoa-hoc' },
      secondaryCta: { label: 'Đăng ký tham dự', href: '/dang-ky' },
    },
    stats: [],
    differentiators: [],
    roadmap: [],
    responsibleAi: { title: '', intro: '', rules: [], kpiNote: '' },
    contact: {
      unit: '', address: '', email: '', phone: '',
      registrationDeadline: '', note: '',
    },
    chat: { greeting: '', suggestions: [], fallback: '' },
  } as SiteContent)

export async function getCourse(identifier: string): Promise<Course | null> {
  try {
    const res = await fetch(`${API_BASE}/api/courses/${encodeURIComponent(identifier)}`, {
      next: { revalidate: REVALIDATE },
    })
    if (!res.ok) return null
    return (await res.json()) as Course
  } catch (error) {
    console.error(`[api] Không lấy được khóa ${identifier}:`, error)
    return null
  }
}

/** "K23" → "Khóa 23". Mã chính thức của chương trình là K21–K28. */
export const courseName = (code: string) => `Khóa ${code.replace(/^K/, '')}`
