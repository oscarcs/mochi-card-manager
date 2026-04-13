import { useEffect, useState } from 'react'

import { fetchDeckExampleCards } from '../lib/mochiApi'
import type { MochiCard } from '../types/decks'

const EXAMPLE_CARD_FETCH_LIMIT = 60

export function useDeckExampleCards(deckId: string) {
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

    let isActive = true

    async function loadExampleCards() {
      setLoading(true)
      setError(null)

      try {
        const nextCards = await fetchDeckExampleCards(deckId, EXAMPLE_CARD_FETCH_LIMIT)

        if (isActive) {
          setCards(nextCards)
        }
      } catch (err) {
        if (isActive) {
          setCards([])
          setError(err instanceof Error ? err.message : 'Failed to load example cards')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadExampleCards()

    return () => {
      isActive = false
    }
  }, [deckId])

  return { cards, loading, error }
}
