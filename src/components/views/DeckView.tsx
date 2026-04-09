import { useEffect, useState } from 'react'
import type { DeckTreeNode, MochiCard, MochiListResponse } from '../../types/decks'
import { DeckCard } from '../DeckCard'

export function DeckView({ deck }: { deck: DeckTreeNode | null }) {
  const [cards, setCards] = useState<MochiCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!deck || deck.kind !== 'deck') {
      setCards([])
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    async function fetchCards() {
      try {
        const allCards: MochiCard[] = []
        let bookmark: string | undefined

        do {
          const params = new URLSearchParams()
          params.set('deck-id', deck!.id)
          if (bookmark) {
            params.set('bookmark', bookmark)
          }

          const res = await fetch(`/api/cards?${params.toString()}`)
          if (!res.ok) {
            throw new Error(`Failed to fetch cards: ${res.status}`)
          }
          
          const data = (await res.json()) as MochiListResponse<MochiCard>
          allCards.push(...data.docs)
          bookmark = data.docs.length > 0 ? data.bookmark : undefined
        } while (bookmark)

        if (isMounted) {
          setCards(allCards)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load cards')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void fetchCards()

    return () => {
      isMounted = false
    }
  }, [deck])

  return (
    <section className="mx-auto flex h-full w-full max-w-[1100px] flex-col">
      <div className="shrink-0 pb-4">
        <h1 className="flex items-center gap-3 text-[20px] font-semibold text-[#F2F2F2]">
          {deck?.name ?? 'No deck selected'}
          {cards.length > 0 && (
            <span className="rounded-full bg-[#303030] px-2.5 py-0.5 text-[14px] font-medium text-[#A0A0A0]">
              {cards.length}
            </span>
          )}
        </h1>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pt-2 pr-2">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#555] border-t-[#A0A0A0]"></div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-[#FF6B6B]">
            <p>{error}</p>
          </div>
        ) : !deck || deck.kind !== 'deck' ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[#6F6F6F]">Select a deck to view its cards.</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[#6F6F6F]">No cards in this deck.</p>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {cards.map((card) => (
              <DeckCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
