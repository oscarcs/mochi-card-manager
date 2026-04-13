import { useEffect, useState } from 'react'

import { fetchDeckCards } from '../lib/mochiApi'
import type { MochiCard } from '../types/decks'

export function useDeckCards(deckId: string | null) {
  const [cards, setCards] = useState<MochiCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!deckId) {
      setCards([])
      setLoading(false)
      setError(null)
      return
    }

    const currentDeckId = deckId
    let isActive = true

    async function loadCards() {
      setLoading(true)
      setError(null)

      try {
        const nextCards = await fetchDeckCards(currentDeckId)

        if (isActive) {
          setCards(nextCards)
        }
      } catch (err) {
        if (isActive) {
          setCards([])
          setError(err instanceof Error ? err.message : 'Failed to load cards')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadCards()

    return () => {
      isActive = false
    }
  }, [deckId])

  return { cards, loading, error }
}
