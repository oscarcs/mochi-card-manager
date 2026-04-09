import type { DeckTreeNode } from '../types/decks'

export const mockDecks: DeckTreeNode[] = [
  {
    id: 'generated',
    name: 'Generated',
    kind: 'deck',
  },
  {
    id: 'finnish',
    name: 'Finnish',
    kind: 'deck',
    isActive: true,
    isExpanded: true,
    children: [
      {
        id: 'finnish-puhekieli',
        name: 'Puhekieli',
        kind: 'deck',
      },
      {
        id: 'finnish-from-english',
        name: 'From English',
        kind: 'deck',
      },
      {
        id: 'finnish-type-1-verbs',
        name: 'Type 1 Verbs',
        kind: 'deck',
      },
      {
        id: 'finnish-to-english',
        name: 'To English',
        kind: 'deck',
      },
    ],
  },
  {
    id: 'notes',
    name: 'Notes',
    kind: 'notes',
  },
]
