import type { LucideIcon } from 'lucide-react'
import { RefreshCw, Settings, Sparkles } from 'lucide-react'
import type { DeckTreeNode } from '../types/decks'
import { DeckTree } from './DeckTree'

export type AppSidebarProps = {
  decks: DeckTreeNode[]
  decksLoading?: boolean
  decksError?: string | null
  decksRefreshedAt?: Date | null
  onRefreshDecks?: () => void
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

function formatRefreshTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function AppSidebar({
  decks,
  decksLoading,
  decksError,
  decksRefreshedAt,
  onRefreshDecks,
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
      <div className="flex flex-1 flex-col gap-5">
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
          {decksLoading ? (
            <p className="px-3 text-[12px] text-[#6F6F6F]">Loading decks…</p>
          ) : decksError ? (
            <p className="px-3 text-[12px] text-red-400">{decksError}</p>
          ) : (
            <DeckTree
              nodes={decks}
              selectedNodeId={activeScreen === 'deck' ? activeDeckId : null}
              onCreateDeck={onCreateDeck}
              onSelectNode={onSelectDeck}
              onToggleNode={onToggleDeck}
            />
          )}
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

      <div className="flex items-center justify-between border-t border-[#303030] px-4 pt-3">
        <span className="text-[11px] text-[#6F6F6F]">
          {decksLoading
            ? 'Syncing…'
            : decksRefreshedAt
              ? `Synced ${formatRefreshTime(decksRefreshedAt)}`
              : 'Not synced'}
        </span>
        <button
          type="button"
          onClick={onRefreshDecks}
          disabled={decksLoading}
          className="rounded p-1 text-[#6F6F6F] transition-colors hover:bg-[#323232] hover:text-[#B0B0B0] disabled:opacity-50"
          title="Refresh decks"
        >
          <RefreshCw className={`h-3 w-3 ${decksLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </aside>
  )
}
