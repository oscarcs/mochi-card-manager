export type GeneratedCard = {
  front: string
  back: string
  notes?: string
}

export type ProposedCard = GeneratedCard & {
  id: string
  deckId: string
  isSelected: boolean
  status: 'pending' | 'submitting' | 'approved'
  error?: string
}
