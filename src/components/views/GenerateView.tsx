import type { RefObject } from 'react'

import { DeckCard } from '../DeckCard'
import { buildPreviewCard } from '../../lib/mochiCards'
import type { ProposedCard } from '../../types/cards'
import type { DeckTreeNode } from '../../types/decks'

type GenerateViewProps = {
  language: string
  languageOptions: string[]
  deckId: string
  deckOptions: DeckTreeNode[]
  prompt: string
  onLanguageChange: (value: string) => void
  onDeckChange: (value: string) => void
  onPromptChange: (value: string) => void
  onSubmit: () => void
  onClear: () => void
  onAcceptCard: (cardId: string) => void
  onRejectCard: (cardId: string) => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
  isGenerating: boolean
  isLoadingExamples: boolean
  exampleCount: number
  proposedCards: ProposedCard[]
  error: unknown
}

function StatusCopy({
  error,
  isGenerating,
  isLoadingExamples,
  exampleCount,
}: {
  error: unknown
  isGenerating: boolean
  isLoadingExamples: boolean
  exampleCount: number
}) {
  if (error instanceof Error) {
    return <p className="text-xs text-[#FF8C8C]">{error.message}</p>
  }

  if (isGenerating) {
    return <p className="text-xs text-[#8D8D8D]">Generating proposed cards…</p>
  }

  if (isLoadingExamples) {
    return <p className="text-xs text-[#8D8D8D]">Loading example cards from the selected deck…</p>
  }

  return (
    <p className="text-xs text-[#8D8D8D]">
      {exampleCount > 0
        ? `${exampleCount} example cards from the selected deck will be included in the prompt.`
        : 'No example cards found in the selected deck yet.'}
    </p>
  )
}

function ProposalStatus({
  status,
  error,
}: {
  status: ProposedCard['status']
  error?: string
}) {
  if (status === 'accepted') {
    return (
      <span className="rounded-full border border-[#43614E] bg-[#213027] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A7D0B0]">
        Added
      </span>
    )
  }

  if (status === 'rejected') {
    return (
      <span className="rounded-full border border-[#5A4444] bg-[#2E2323] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D2A4A4]">
        Rejected
      </span>
    )
  }

  if (error) {
    return (
      <span className="rounded-full border border-[#6D4949] bg-[#352626] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FF9C9C]">
        Error
      </span>
    )
  }

  return (
    <span className="rounded-full border border-[#444444] bg-[#2C2C2C] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A8A8A8]">
      Proposed
    </span>
  )
}

function ProposedCardsPanel({
  proposedCards,
  onAcceptCard,
  onRejectCard,
}: {
  proposedCards: ProposedCard[]
  onAcceptCard: (cardId: string) => void
  onRejectCard: (cardId: string) => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#767676]">
          Proposed Cards
        </p>
        <p className="mt-2 text-sm text-[#AAAAAA]">
          Review each card and add only the ones you want to keep.
        </p>
      </div>

      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
        {proposedCards.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-[12px] border border-dashed border-[#343434] bg-[#202020]">
            <p className="px-6 text-center text-sm leading-6 text-[#6F6F6F]">
              Generate a batch to review proposed cards here.
            </p>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2">
            {proposedCards.map((card) => (
              <DeckCard
                key={card.id}
                card={buildPreviewCard(card, card.deckId, card.id)}
                footer={
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <ProposalStatus status={card.status} error={card.error} />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onRejectCard(card.id)}
                          disabled={card.status !== 'pending'}
                          className="rounded-md border border-[#4A4A4A] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#B0B0B0] transition-colors hover:bg-[#343434] hover:text-[#ECECEC] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => onAcceptCard(card.id)}
                          disabled={card.status !== 'pending'}
                          className="rounded-md bg-[#E7E2D2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1E1E1E] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                    {card.error ? <p className="text-xs text-[#FF9C9C]">{card.error}</p> : null}
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function GenerateView({
  language,
  languageOptions,
  deckId,
  deckOptions,
  prompt,
  onLanguageChange,
  onDeckChange,
  onPromptChange,
  onSubmit,
  onClear,
  onAcceptCard,
  onRejectCard,
  textareaRef,
  isGenerating,
  isLoadingExamples,
  exampleCount,
  proposedCards,
  error,
}: GenerateViewProps) {
  return (
    <section className="mx-auto grid h-full min-h-0 w-full max-w-[1240px] gap-8 overflow-y-auto xl:grid-cols-[minmax(0,0.92fr)_minmax(360px,1fr)] xl:grid-rows-[minmax(0,1fr)]">
      <div className="flex min-h-0 min-w-0 flex-col gap-5 xl:h-full">
        <div>
          <p className="text-sm leading-6 text-[#AAAAAA]">
            Choose a deck, add context, and review the proposed cards.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#808080]">
              Language
            </span>
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value)}
              className="rounded-[12px] border border-[#3A3A3A] bg-[#1F1F1F] px-4 py-3 text-sm text-[#ECECEC] outline-none"
            >
              {languageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#808080]">
              Deck
            </span>
            <select
              value={deckId}
              onChange={(event) => onDeckChange(event.target.value)}
              className="rounded-[12px] border border-[#3A3A3A] bg-[#1F1F1F] px-4 py-3 text-sm text-[#ECECEC] outline-none"
            >
              {deckOptions.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-[12px] border border-[#343434] bg-[#202020] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#767676]">
            Source guidance
          </p>
          <p className="mt-2 text-sm leading-6 text-[#A9A9A9]">
            Paste a link to an article, lesson, or reference page directly into your instructions. The
            agent will retrieve the page, extract the relevant text, and generate cards from it.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-[12px] border border-[#343434] bg-[#1F1F1F] p-4 xl:h-full">
          <label className="flex min-h-0 flex-1 flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#808080]">
              Supplementary prompt
            </span>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              rows={10}
              placeholder="Paste a URL and explain what kinds of cards you want, the difficulty level, or the concepts to emphasize."
              className="min-h-[220px] w-full flex-1 resize-none overflow-y-auto bg-transparent text-sm leading-6 text-[#EFEFEF] outline-none placeholder:text-[#6C6C6C]"
            />
          </label>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-[#303030] pt-4">
            <StatusCopy
              error={error}
              isGenerating={isGenerating}
              isLoadingExamples={isLoadingExamples}
              exampleCount={exampleCount}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClear}
                className="rounded-full border border-[#4B4B4B] bg-[#262626] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D0D0D0] transition-colors hover:border-[#5C5C5C] hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={isGenerating || !prompt.trim() || !deckId}
                className="rounded-full border border-[#E7E2D2] bg-[#E7E2D2] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1E1E1E] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 xl:h-full">
        <ProposedCardsPanel proposedCards={proposedCards} onAcceptCard={onAcceptCard} onRejectCard={onRejectCard} />
      </div>
    </section>
  )
}
