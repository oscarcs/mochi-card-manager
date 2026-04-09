import type { LucideIcon } from 'lucide-react'
import { Settings, Sparkles } from 'lucide-react'
import { DeckTree, type DeckTreeNode } from './DeckTree'

export type AppSidebarProps = {
  decks: DeckTreeNode[]
  activeScreen: 'deck' | 'generate' | 'settings'
  activeDeckId?: string | null
  onGenerateCards?: () => void
  generateDisabled?: boolean
  generateLabel?: string
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
  disabled?: boolean
  active?: boolean
}

function SidebarButton({
  label,
  icon: Icon,
  onClick,
  muted = false,
  disabled = false,
  active = false,
}: SidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center rounded-md px-1 py-1.5 text-left text-[13px] font-medium transition-colors ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : active
          ? 'bg-[#323232] text-[#E0E0E0]'
          : muted
          ? 'cursor-pointer text-[#B0B0B0] hover:bg-[#323232]'
          : 'cursor-pointer text-[#E0E0E0] hover:bg-[#323232]'
      }`}
    >
      <span className="flex items-center gap-1.5">
        <span className="h-[12px] w-[12px] flex-shrink-0" aria-hidden="true" />
        <Icon className="h-[13px] w-[13px] text-[#A0A0A0]" />
        <span>{label}</span>
      </span>
    </button>
  )
}

export function AppSidebar({
  decks,
  activeScreen,
  activeDeckId,
  onGenerateCards,
  generateDisabled,
  generateLabel = 'Generate Cards',
  onSettingsClick,
  onCreateDeck,
  onSelectDeck,
  onToggleDeck,
}: AppSidebarProps) {
  return (
    <aside className="flex w-[260px] flex-shrink-0 flex-col border-r border-[#303030] bg-[#212121] py-4">
      <div className="flex flex-col gap-5">
        <div className="px-3">
          <SidebarButton
            label={generateLabel}
            icon={Sparkles}
            onClick={onGenerateCards}
            disabled={generateDisabled}
            active={activeScreen === 'generate'}
          />
        </div>

        <div className="px-3">
          <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[#7a7a7a]">
            Decks
          </h2>
          <DeckTree
            nodes={decks}
            selectedNodeId={activeScreen === 'deck' ? activeDeckId : null}
            onCreateDeck={onCreateDeck}
            onSelectNode={onSelectDeck}
            onToggleNode={onToggleDeck}
          />
        </div>

        <div className="px-3">
          <SidebarButton
            label="Settings"
            icon={Settings}
            muted
            onClick={onSettingsClick}
            active={activeScreen === 'settings'}
          />
        </div>
      </div>
    </aside>
  )
}
