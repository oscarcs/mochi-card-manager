export type GeneratedCard = {
  front: string
  back: string
  notes?: string
}

export type ProposedCard = GeneratedCard & {
  id: string
  deckId: string
  status: 'pending' | 'accepted' | 'rejected'
  error?: string
}
