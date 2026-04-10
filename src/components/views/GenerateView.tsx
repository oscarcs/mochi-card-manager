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
  onApproveSelected: () => void
  onClearPendingCards: () => void
  onDeselectAllCards: () => void
  onToggleCardSelection: (cardId: string) => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
  isGenerating: boolean
  isApprovingCards: boolean
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

function ProposalMeta({
  status,
  error,
  isSelected,
}: {
  status: ProposedCard['status']
  error?: string
  isSelected: boolean
}) {
  if (status === 'approved') {
    return (
      <span className="rounded-full border border-[#43614E] bg-[#213027] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A7D0B0]">
        Added
      </span>
    )
  }

  if (status === 'submitting') {
    return (
      <span className="rounded-full border border-[#525252] bg-[#303030] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D8D8D8]">
        Adding…
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
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
        isSelected
          ? 'border-[#5C7566] bg-[#223128] text-[#B8D7BF]'
          : 'border-[#444444] bg-[#2C2C2C] text-[#969696]'
      }`}
    >
      {isSelected ? 'Selected' : 'Not Selected'}
    </span>
  )
}

function ProposedCardsPanel({
  proposedCards,
  onApproveSelected,
  onClearPendingCards,
  onDeselectAllCards,
  onToggleCardSelection,
  isApprovingCards,
}: {
  proposedCards: ProposedCard[]
  onApproveSelected: () => void
  onClearPendingCards: () => void
  onDeselectAllCards: () => void
  onToggleCardSelection: (cardId: string) => void
  isApprovingCards: boolean
}) {
  const pendingCards = proposedCards.filter((card) => card.status !== 'approved')
  const selectedPendingCards = pendingCards.filter((card) => card.isSelected)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#767676]">
              Proposed Cards
            </p>
            <p className="mt-2 text-sm text-[#AAAAAA]">
              Cards start selected. Deselect anything you do not want to send to Mochi.
            </p>
          </div>

          {proposedCards.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClearPendingCards}
                disabled={pendingCards.length === 0 || isApprovingCards}
                className="rounded-full border border-[#4B4B4B] bg-[#262626] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D0D0D0] transition-colors hover:border-[#5C5C5C] hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear Pending
              </button>
              <button
                type="button"
                onClick={onDeselectAllCards}
                disabled={selectedPendingCards.length === 0 || isApprovingCards}
                className="rounded-full border border-[#4B4B4B] bg-[#262626] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D0D0D0] transition-colors hover:border-[#5C5C5C] hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Deselect All
              </button>
              <button
                type="button"
                onClick={onApproveSelected}
                disabled={selectedPendingCards.length === 0 || isApprovingCards}
                className="rounded-full border border-[#E7E2D2] bg-[#E7E2D2] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1E1E1E] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isApprovingCards
                  ? 'Approving…'
                  : `Approve Selected${selectedPendingCards.length > 0 ? ` (${selectedPendingCards.length})` : ''}`}
              </button>
            </div>
          ) : null}
        </div>
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
                className={`cursor-pointer transition-all ${
                  card.status === 'approved'
                    ? 'border-[#4A6554] shadow-[0_0_0_1px_rgba(95,139,105,0.22)]'
                    : card.isSelected
                      ? 'border-[#6E8F7A] shadow-[0_0_0_1px_rgba(115,170,132,0.75),0_0_28px_rgba(77,122,90,0.28)]'
                      : 'border-[#3E3E3E] opacity-90'
                }`}
                onClick={() => {
                  const selectedText = window.getSelection()?.toString().trim()

                  if (selectedText) {
                    return
                  }

                  onToggleCardSelection(card.id)
                }}
                footer={
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <ProposalMeta status={card.status} error={card.error} isSelected={card.isSelected} />
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
  onApproveSelected,
  onClearPendingCards,
  onDeselectAllCards,
  onToggleCardSelection,
  textareaRef,
  isGenerating,
  isApprovingCards,
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
            Choose a deck, add context, and review the proposed cards. Paste a link to an article,
            lesson, or reference page directly into your instructions. The agent will retrieve the page,
            extract the relevant text, and generate cards from it.
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
        <ProposedCardsPanel
          proposedCards={proposedCards}
          onApproveSelected={onApproveSelected}
          onClearPendingCards={onClearPendingCards}
          onDeselectAllCards={onDeselectAllCards}
          onToggleCardSelection={onToggleCardSelection}
          isApprovingCards={isApprovingCards}
        />
      </div>
    </section>
  )
}
