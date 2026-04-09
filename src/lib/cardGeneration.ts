import type { GeneratedCard } from '../types/cards'

type MessagePart = { type: string } & Record<string, unknown>

export function buildStarterPrompt(deckName: string) {
  return `Create 5 flashcards for the "${deckName}" deck. Focus on practical recall, short answers, and add brief notes when useful.`
}

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
