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
