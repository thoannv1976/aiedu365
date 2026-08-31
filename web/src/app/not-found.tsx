import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="section">
      <div className="container-page max-w-xl text-center">
        <p className="font-mono text-sm muted">404</p>
        <h1 className="heading mt-3">Không tìm thấy trang</h1>
        <p className="mt-4 muted">
          Trang anh/chị tìm không tồn tại hoặc đã đổi đường dẫn. Các khóa tập huấn được đánh mã từ
          Khóa 21 đến Khóa 28.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/khoa-hoc" className="btn-primary">
            Xem 08 khóa tập huấn
          </Link>
          <Link href="/" className="btn-outline">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
