import { AppSidebar } from './components/AppSidebar'
import { FlashcardPreview } from './components/FlashcardPreview'
import type { DeckTreeNode } from './components/DeckTree'

const mockDecks: DeckTreeNode[] = [
  {
    id: 'generated',
    name: 'Generated',
    kind: 'deck',
  },
  {
    id: 'finnish',
    name: 'Finnish',
    kind: 'deck',
    count: 2,
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
        count: 1,
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
        count: 1,
      },
    ],
  },
  {
    id: 'notes',
    name: 'Notes',
    kind: 'notes',
  },
]

export default function App() {
  return (
    <div className="flex h-full w-full bg-[#262626] text-[#e0e0e0] font-sans antialiased text-left select-none">
      <AppSidebar
        decks={mockDecks}
        onGenerateCards={() => {}}
        onSettingsClick={() => {}}
        onCreateDeck={() => {}}
        onSelectDeck={() => {}}
        onToggleDeck={() => {}}
      />

      <div className="relative flex h-full flex-1 items-center justify-center bg-[#282828]">
        <FlashcardPreview
          prompt={'In Finnish: "to think"'}
          actionLabel="Next Side"
          actionShortcut="Space"
          onAdvance={() => {}}
          onOpenMenu={() => {}}
        />
      </div>
    </div>
  )
}
