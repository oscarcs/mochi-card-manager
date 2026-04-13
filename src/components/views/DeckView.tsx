import { useDeckCards } from '../../hooks/useDeckCards'
import type { DeckTreeNode } from '../../types/decks'
import { DeckCard } from '../DeckCard'

export function DeckView({ deck }: { deck: DeckTreeNode | null }) {
  const deckId = deck?.kind === 'deck' ? deck.id : null
  const { cards, loading, error } = useDeckCards(deckId)

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
