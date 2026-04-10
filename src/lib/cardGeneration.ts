import type { GeneratedCard } from '../types/cards'
import type { MochiCard } from '../types/decks'
import { getDisplaySides } from './mochiCards'

type MessagePart = { type: string } & Record<string, unknown>

export function extractMessageText(parts: MessagePart[]) {
  return parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text as string)
    .join('')
}

export function extractCardsFromAssistantResponse(response: string): GeneratedCard[] {
  const codeBlockMatch = response.match(/```json\s*([\s\S]*?)```/i)
  const jsonText = codeBlockMatch?.[1]?.trim() ?? response.trim()

  if (!jsonText) {
    return []
  }

  try {
    const parsed = JSON.parse(jsonText) as {
      cards?: Array<Record<string, unknown>>
    }

    if (!Array.isArray(parsed.cards)) {
      return []
    }

    return parsed.cards
      .map<GeneratedCard | null>((card) => {
        const front = typeof card.front === 'string' ? card.front : null
        const back = typeof card.back === 'string' ? card.back : null
        const notes = typeof card.notes === 'string' ? card.notes : undefined

        if (!front || !back) {
          return null
        }

        return { front, back, notes }
      })
      .filter((card): card is GeneratedCard => card !== null)
  } catch {
    return []
  }
}

export function buildGenerationPrompt({
  language,
  deckName,
  examples,
  userPrompt,
}: {
  language: string
  deckName: string
  examples: GeneratedCard[]
  userPrompt: string
}) {
  const exampleBlock =
    examples.length > 0
      ? JSON.stringify(
          {
            exampleCards: examples,
          },
          null,
          2
        )
      : 'No example cards were available from the selected deck.'

  return [
    `Target language: ${language}`,
    `Target deck: ${deckName}`,
    'Use the deck examples to match the level and card format.',
    'If the user included one or more URLs, fetch them first and ground the cards in that source material.',
    '',
    'Example cards:',
    exampleBlock,
    '',
    'Supplementary instructions:',
    userPrompt.trim(),
  ].join('\n')
}

export function pickExampleCards(cards: MochiCard[], count: number): GeneratedCard[] {
  const shuffled = [...cards].sort(() => Math.random() - 0.5)

  return shuffled
    .map((card) => {
      const { front, back } = getDisplaySides(card)

      if (!front.trim() || !back.trim()) {
        return null
      }

      return {
        front: front.trim(),
        back: back.trim(),
      }
    })
    .filter((card): card is GeneratedCard => card !== null)
    .slice(0, count)
}

function normalizeForDuplicateCheck(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildFrontDuplicateKey(front: string) {
  return `front:${normalizeForDuplicateCheck(front)}`
}

function buildFrontBackDuplicateKey(front: string, back: string) {
  return `pair:${normalizeForDuplicateCheck(front)}|||${normalizeForDuplicateCheck(back)}`
}

export function buildExistingCardDuplicateKeySet(cards: MochiCard[]) {
  const keys = new Set<string>()

  for (const card of cards) {
    const { front, back } = getDisplaySides(card)
    const normalizedFront = normalizeForDuplicateCheck(front)
    const normalizedBack = normalizeForDuplicateCheck(back)

    if (!normalizedFront) {
      continue
    }

    keys.add(buildFrontDuplicateKey(front))

    if (normalizedBack) {
      keys.add(buildFrontBackDuplicateKey(front, back))
    }
  }

  return keys
}

export function filterDuplicateGeneratedCards(
  cards: GeneratedCard[],
  existingDuplicateKeys: Set<string>
) {
  const seenKeys = new Set(existingDuplicateKeys)
  const uniqueCards: GeneratedCard[] = []
  let filteredCount = 0

  for (const card of cards) {
    const frontKey = buildFrontDuplicateKey(card.front)
    const frontBackKey = buildFrontBackDuplicateKey(card.front, card.back)

    if (seenKeys.has(frontKey) || seenKeys.has(frontBackKey)) {
      filteredCount += 1
      continue
    }

    seenKeys.add(frontKey)
    seenKeys.add(frontBackKey)
    uniqueCards.push(card)
  }

  return { uniqueCards, filteredCount }
}
