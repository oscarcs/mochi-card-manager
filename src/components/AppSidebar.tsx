import type { LucideIcon } from 'lucide-react'
import { Settings, Sparkles } from 'lucide-react'
import { DeckTree, type DeckTreeNode } from './DeckTree'

export type AppSidebarProps = {
  decks: DeckTreeNode[]
  onGenerateCards?: () => void
  onSettingsClick?: () => void
  onCreateDeck?: () => void
  onSelectDeck?: (deckId: string) => void
  onToggleDeck?: (deckId: string) => void
}

type SidebarButtonProps = {
  label: string
  icon: LucideIcon
  onClick?: () => void
  muted?: boolean
}

function SidebarButton({
  label,
  icon: Icon,
  onClick,
  muted = false,
}: SidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-left text-sm font-medium transition-colors ${
        muted
          ? 'cursor-pointer text-[#B0B0B0] hover:bg-[#323232]'
          : 'cursor-pointer text-[#E0E0E0] hover:bg-[#323232]'
      }`}
    >
      <Icon className="h-[18px] w-[18px] text-[#A0A0A0]" />
      <span>{label}</span>
    </button>
  )
}

export function AppSidebar({
  decks,
  onGenerateCards,
  onSettingsClick,
  onCreateDeck,
  onSelectDeck,
  onToggleDeck,
}: AppSidebarProps) {
  return (
    <aside className="flex w-[260px] flex-shrink-0 flex-col justify-between border-r border-[#303030] bg-[#212121] py-4">
      <div className="flex flex-col">
        <div className="mb-6 px-3">
          <SidebarButton
            label="Generate Cards"
            icon={Sparkles}
            onClick={onGenerateCards}
          />
        </div>

        <div className="px-3">
          <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[#7a7a7a]">
            Decks
          </h2>
          <DeckTree
            nodes={decks}
            onCreateDeck={onCreateDeck}
            onSelectNode={onSelectDeck}
            onToggleNode={onToggleDeck}
          />
        </div>
      </div>

      <div className="mb-2 px-3">
        <SidebarButton
          label="Settings"
          icon={Settings}
          muted
          onClick={onSettingsClick}
        />
      </div>
    </aside>
  )
}
