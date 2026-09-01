'use client'

/** Thanh lưu cố định dưới màn hình, chỉ hiện khi có thay đổi chưa lưu. */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
  notice,
}: {
  dirty: boolean
  saving: boolean
  onSave: () => void
  onReset: () => void
  notice?: string
}) {
  if (!dirty && !notice) return null

  return (
    <div className="sticky bottom-0 z-20 -mx-5 mt-8 border-t surface px-5 py-3 sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        {dirty ? (
          <>
            <button type="button" onClick={onSave} disabled={saving} className="btn-primary !px-4 !py-2 text-sm">
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
            <button type="button" onClick={onReset} className="btn-outline !px-4 !py-2 text-sm">
              Hủy
            </button>
            <span className="text-xs muted">Có thay đổi chưa lưu.</span>
          </>
        ) : (
          <span className="text-sm text-emerald-700 dark:text-emerald-400">{notice}</span>
        )}
      </div>
    </div>
  )
}

/** Ô nhập một dòng, có nhãn và gợi ý. */
export function Field({
  label,
  hint,
  value,
  onChange,
  type = 'text',
  placeholder,
  className = '',
}: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  className?: string
}) {
  const id = `f-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
      />
      {hint && <p className="mt-1 text-xs muted">{hint}</p>}
    </div>
  )
}

/** Ô nhập nhiều dòng. */
export function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 4,
  placeholder,
  className = '',
}: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  className?: string
}) {
  const id = `t-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand-500"
      />
      {hint && <p className="mt-1 text-xs muted">{hint}</p>}
    </div>
  )
}

/**
 * Danh sách chuỗi, nhập mỗi dòng một mục.
 *
 * Đơn giản hơn hẳn một trình soạn thảo danh sách, và đúng với cách ban tổ chức
 * vẫn soạn nội dung — dán từ Word xuống là ra đúng danh sách.
 */
export function LineList({
  label,
  hint,
  value,
  onChange,
  rows = 6,
}: {
  label: string
  hint?: string
  value: string[]
  onChange: (value: string[]) => void
  rows?: number
}) {
  return (
    <TextArea
      label={label}
      hint={hint ?? 'Mỗi dòng là một mục.'}
      rows={rows}
      value={value.join('\n')}
      onChange={(text) => onChange(text.split('\n').map((l) => l.trim()).filter(Boolean))}
    />
  )
}
