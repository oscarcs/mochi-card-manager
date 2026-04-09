import type { MochiCard } from '../types/decks'

type CardSideProps = {
  value: string
  className: string
  emptyLabel: string
}

type ParsedCardContent = {
  text: string
  imageUrls: string[]
}

function splitRawContent(content: string) {
  const parts = content.split(/\n\s*---\s*\n/)
  return {
    front: parts[0] || '',
    back: parts.slice(1).join('\n---\n') || '',
  }
}

function normalizeImageUrl(url: string): string {
  const trimmed = url.trim()

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  return trimmed
}

function parseCardContent(value: string): ParsedCardContent {
  const imageUrls = new Set<string>()
  const markdownImagePattern = /!\[[^\]]*]\(([^)]+)\)/g
  const htmlImagePattern = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi

  const textWithoutMarkdownImages = value.replace(markdownImagePattern, (_, url: string) => {
    imageUrls.add(normalizeImageUrl(url))
    return ''
  })

  const textWithoutImages = textWithoutMarkdownImages.replace(
    htmlImagePattern,
    (_, url: string) => {
      imageUrls.add(normalizeImageUrl(url))
      return ''
    }
  )

  return {
    text: textWithoutImages.trim(),
    imageUrls: [...imageUrls],
  }
}

function pickFieldValue(
  fields: Record<string, { id: string; value: string }> | undefined,
  patterns: RegExp[]
): string | null {
  if (!fields) {
    return null
  }

  for (const [name, field] of Object.entries(fields) as Array<
    [string, { id: string; value: string }]
  >) {
    if (patterns.some((pattern) => pattern.test(name)) && field.value.trim()) {
      return field.value
    }
  }

  return null
}

function getDisplaySides(card: MochiCard) {
  const fallback = splitRawContent(card.content)
  const frontFromFields = pickFieldValue(card.fields, [
    /^front$/i,
    /^question$/i,
    /^prompt$/i,
    /^term$/i,
    /^word$/i,
    /^expression$/i,
  ])
  const backFromFields = pickFieldValue(card.fields, [
    /^back$/i,
    /^answer$/i,
    /^definition$/i,
    /^meaning$/i,
    /^translation$/i,
    /^response$/i,
  ])

  if (frontFromFields || backFromFields) {
    return {
      front: frontFromFields ?? fallback.front,
      back: backFromFields ?? fallback.back,
    }
  }

  const fieldValues = Object.values(card.fields ?? {})
    .map((field) => field.value.trim())
    .filter(Boolean)

  if (fieldValues.length >= 2) {
    return {
      front: fieldValues[0],
      back: fieldValues.slice(1).join('\n\n'),
    }
  }

  if (fieldValues.length === 1 && !fallback.front.trim()) {
    return {
      front: fieldValues[0],
      back: fallback.back,
    }
  }

  return fallback
}

function CardSide({ value, className, emptyLabel }: CardSideProps) {
  const { text, imageUrls } = parseCardContent(value)
  const hasContent = text || imageUrls.length > 0

  return (
    <div className={className}>
      {hasContent ? (
        <div className="flex flex-col items-center gap-3">
          {imageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              loading="lazy"
              className="max-h-56 w-auto max-w-full rounded-[8px] object-contain"
            />
          ))}
          {text ? <div className="w-full whitespace-pre-wrap">{text}</div> : null}
        </div>
      ) : (
        <span className="italic text-[#888]">{emptyLabel}</span>
      )}
    </div>
  )
}

export function DeckCard({ card }: { card: MochiCard }) {
  const { front, back } = getDisplaySides(card)

  return (
    <div className="mb-4 flex flex-col overflow-hidden break-inside-avoid rounded-[12px] border border-[#3E3E3E] bg-[#323232] shadow-sm">
      <CardSide
        value={front}
        className="flex-1 p-5 text-center text-[14px] font-medium leading-relaxed text-[#E8E8E8]"
        emptyLabel="Empty card"
      />

      {back.trim() && (
        <CardSide
          value={back}
          className="border-t border-dashed border-[#4A4A4A] bg-[#2A2A2A] p-4 text-center text-[14px] leading-relaxed text-[#A0A0A0]"
          emptyLabel="Empty back"
        />
      )}
    </div>
  )
}
