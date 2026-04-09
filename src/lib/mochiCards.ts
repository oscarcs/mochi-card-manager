import type { GeneratedCard } from '../types/cards'
import type { MochiCard } from '../types/decks'

export type ParsedCardContent = {
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

export function parseCardContent(value: string): ParsedCardContent {
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

export function getDisplaySides(card: MochiCard) {
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

export function buildMochiCardContent(card: GeneratedCard) {
  const back = card.notes?.trim()
    ? `${card.back.trim()}\n\nNotes: ${card.notes.trim()}`
    : card.back.trim()

  return `${card.front.trim()}\n---\n${back}`
}

export function buildPreviewCard(card: GeneratedCard, deckId: string, id: string): MochiCard {
  return {
    id,
    'deck-id': deckId,
    content: buildMochiCardContent(card),
  }
}
