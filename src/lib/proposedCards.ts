import {
  extractCardsFromAssistantResponse,
  filterDuplicateGeneratedCards,
} from './cardGeneration'
import type { ProposedCard } from '../types/cards'

function buildProposalId(deckId: string, index: number, front: string, back: string) {
  return `proposal-${deckId}-${index}-${front}-${back}`
}

export function buildGeneratedCardProposals(
  responseText: string,
  existingDuplicateKeys: Set<string>,
  deckId: string
) {
  const generatedCards = extractCardsFromAssistantResponse(responseText)
  const { uniqueCards, filteredCount } = filterDuplicateGeneratedCards(
    generatedCards,
    existingDuplicateKeys
  )

  const proposedCards = uniqueCards.map((card, index) => ({
    ...card,
    id: buildProposalId(deckId, index, card.front, card.back),
    deckId,
    isSelected: true,
    status: 'pending' as const,
  }))

  return { proposedCards, filteredCount }
}

export function togglePendingCardSelection(cards: ProposedCard[], cardId: string) {
  return cards.map((card) =>
    card.id === cardId && card.status === 'pending'
      ? {
          ...card,
          isSelected: !card.isSelected,
          error: undefined,
        }
      : card
  )
}

export function deselectPendingCards(cards: ProposedCard[]) {
  return cards.map((card) =>
    card.status === 'pending'
      ? {
          ...card,
          isSelected: false,
          error: undefined,
        }
      : card
  )
}

export function keepApprovedCards(cards: ProposedCard[]) {
  return cards.filter((card) => card.status === 'approved')
}

export function markSelectedCardsSubmitting(cards: ProposedCard[]) {
  return cards.map((card) =>
    card.status === 'pending' && card.isSelected
      ? {
          ...card,
          status: 'submitting' as const,
          error: undefined,
        }
      : card
  )
}

export function markCardApproved(cards: ProposedCard[], cardId: string) {
  return cards.map((card) =>
    card.id === cardId
      ? {
          ...card,
          status: 'approved' as const,
          isSelected: false,
          error: undefined,
        }
      : card
  )
}

export function markCardError(cards: ProposedCard[], cardId: string, message: string) {
  return cards.map((card) =>
    card.id === cardId
      ? {
          ...card,
          status: 'pending' as const,
          error: message,
        }
      : card
  )
}
