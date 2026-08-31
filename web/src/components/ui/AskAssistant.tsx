'use client'

export function AskAssistant({
  question,
  label = 'Hỏi trợ lý AI',
  className = '',
}: {
  question?: string
  label?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new CustomEvent('aiedu:open-chat', { detail: { question } }))
      }
      className={`btn-primary ${className}`}
    >
      {label}
    </button>
  )
}
