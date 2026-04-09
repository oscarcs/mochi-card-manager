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
