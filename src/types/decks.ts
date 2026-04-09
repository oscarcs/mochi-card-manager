export type DeckTreeNode = {
  id: string
  name: string
  kind: 'deck' | 'notes'
  count?: number
  isActive?: boolean
  isExpanded?: boolean
  children?: DeckTreeNode[]
}

export type MainView = 'deck' | 'generate' | 'settings'

export type MochiDeck = {
  id: string
  name: string
  'parent-id'?: string
  'card-count'?: number
  'archived?'?: boolean
  'trashed?'?: { date: string }
  sort?: number
}

export type MochiCard = {
  id: string
  content: string
  'deck-id': string
  'template-id'?: string
  'review-reverse?'?: boolean
  pos?: string
  fields?: Record<string, { id: string; value: string }>
}

export type MochiListResponse<T> = {
  docs: T[]
  bookmark?: string
}
