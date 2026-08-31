/**
 * Trình bày Markdown tối giản cho câu trả lời của trợ lý.
 *
 * Chỉ hỗ trợ đúng những gì system prompt yêu cầu mô hình sinh ra — đậm,
 * nghiêng, gạch đầu dòng, bảng so sánh — và dựng thành phần tử React thay vì
 * chèn HTML thô, nên nội dung do mô hình sinh không thể trở thành mã chạy được
 * trên trang.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g
  let last = 0
  let match: RegExpExecArray | null
  let index = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const token = match[0]
    const key = `${keyPrefix}-i${index++}`
    if (token.startsWith('**')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={key} className="rounded bg-black/5 px-1 py-0.5 text-[0.9em] dark:bg-white/10">
          {token.slice(1, -1)}
        </code>,
      )
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>)
    }
    last = match.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

const isTableRow = (line: string) => line.trim().startsWith('|') && line.trim().endsWith('|')
const isSeparator = (line: string) => /^\|[\s:|-]+\|$/.test(line.trim())
const splitRow = (line: string) =>
  line.trim().slice(1, -1).split('|').map((cell) => cell.trim())

export function Markdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let bullets: string[] = []
  let key = 0

  const flushBullets = () => {
    if (!bullets.length) return
    blocks.push(
      <ul key={`ul-${key++}`} className="my-2 list-disc space-y-1 pl-5">
        {bullets.map((item, i) => (
          <li key={i}>{renderInline(item, `b${key}-${i}`)}</li>
        ))}
      </ul>,
    )
    bullets = []
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    if (isTableRow(line) && isSeparator(lines[i + 1] ?? '')) {
      flushBullets()
      const header = splitRow(line)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]))
        i += 1
      }
      i -= 1
      blocks.push(
        <div key={`t-${key++}`} className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {header.map((cell, ci) => (
                  <th
                    key={ci}
                    className="border-b border-[rgb(var(--border))] px-2 py-1.5 text-left font-semibold"
                  >
                    {renderInline(cell, `th${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="border-b border-[rgb(var(--border))] px-2 py-1.5 align-top"
                    >
                      {renderInline(cell, `td${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    const bullet = line.match(/^\s*[-*•]\s+(.*)$/)
    if (bullet) {
      bullets.push(bullet[1])
      continue
    }

    flushBullets()
    if (!line.trim()) continue

    const heading = line.match(/^#{1,4}\s+(.*)$/)
    if (heading) {
      blocks.push(
        <p key={`h-${key++}`} className="mt-3 font-semibold">
          {renderInline(heading[1], `h${key}`)}
        </p>,
      )
      continue
    }

    blocks.push(
      <p key={`p-${key++}`} className="my-1.5 leading-relaxed">
        {renderInline(line, `p${key}`)}
      </p>,
    )
  }

  flushBullets()
  return <div className="text-sm">{blocks}</div>
}
