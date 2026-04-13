import { useCallback, useEffect, useRef, useState } from 'react'
import { useAgent } from 'agents/react'
import { useAgentChat } from 'agents/ai-react'

import { AppSidebar } from './components/AppSidebar'
import { DeckView } from './components/views/DeckView'
import { GenerateView } from './components/views/GenerateView'
import { SettingsView } from './components/views/SettingsView'
import { useDeckExampleCards } from './hooks/useDeckExampleCards'
import {
  buildExistingCardDuplicateKeySet,
  buildGenerationPrompt,
  extractMessageText,
  pickExampleCards,
} from './lib/cardGeneration'
import { fetchDeckCards, fetchDecks, createDeckCard } from './lib/mochiApi'
import {
  buildGeneratedCardProposals,
  deselectPendingCards,
  keepApprovedCards,
  markCardApproved,
  markCardError,
  markSelectedCardsSubmitting,
  togglePendingCardSelection,
} from './lib/proposedCards'
import {
  activateDeck,
  buildDeckTree,
  findActiveDeck,
  findNodeById,
  flattenDeckOptions,
  toggleDeck,
} from './lib/deckTree'
import type { ProposedCard } from './types/cards'
import type { DeckTreeNode, MainView } from './types/decks'

const FALLBACK_DECK: DeckTreeNode = {
  id: 'loading',
  name: 'Loading…',
  kind: 'deck',
}

const LAST_LANGUAGE_STORAGE_KEY = 'mochi-card-manager:last-language'
const GENERATION_EXAMPLE_CARD_COUNT = 10
const LANGUAGE_OPTIONS = [
  'Finnish',
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Japanese',
  'Korean',
  'Mandarin Chinese',
  'Portuguese',
  'Russian',
]

export default function App() {
  const [decks, setDecks] = useState<DeckTreeNode[]>([])
  const [decksLoading, setDecksLoading] = useState(true)
  const [decksError, setDecksError] = useState<string | null>(null)
  const [decksRefreshedAt, setDecksRefreshedAt] = useState<Date | null>(null)
  const [mainView, setMainView] = useState<MainView>('deck')
  const [prompt, setPrompt] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    if (typeof window === 'undefined') {
      return LANGUAGE_OPTIONS[0]
    }

    return window.localStorage.getItem(LAST_LANGUAGE_STORAGE_KEY) ?? LANGUAGE_OPTIONS[0]
  })
  const [generationDeckId, setGenerationDeckId] = useState<string>('')
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [lastSubmissionDuplicateKeys, setLastSubmissionDuplicateKeys] = useState<Set<string>>(() => new Set())
  const [lastFilteredDuplicateCount, setLastFilteredDuplicateCount] = useState(0)
  const [proposedCards, setProposedCards] = useState<ProposedCard[]>([])
  const [isApprovingCards, setIsApprovingCards] = useState(false)
  const [lastSubmittedDeckId, setLastSubmittedDeckId] = useState<string>('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const lastProposalSyncSignatureRef = useRef('')
  const activeDeck = findActiveDeck(decks) ?? decks[0] ?? FALLBACK_DECK
  const deckOptions = flattenDeckOptions(decks)
  const selectedGenerationDeck =
    findNodeById(decks, generationDeckId) ??
    deckOptions.find((deck) => deck.id === generationDeckId) ??
    activeDeck

  const refreshDecks = useCallback(async () => {
    setDecksLoading(true)
    setDecksError(null)

    try {
      const allDecks = await fetchDecks()
      setDecks(buildDeckTree(allDecks))
      setDecksRefreshedAt(new Date())
    } catch (err) {
      setDecksError(err instanceof Error ? err.message : 'Failed to load decks')
    } finally {
      setDecksLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshDecks()
  }, [refreshDecks])

  useEffect(() => {
    window.localStorage.setItem(LAST_LANGUAGE_STORAGE_KEY, selectedLanguage)
  }, [selectedLanguage])

  const {
    cards: exampleCards,
    loading: examplesLoading,
    error: examplesError,
  } = useDeckExampleCards(generationDeckId)

  useEffect(() => {
    if (!deckOptions.length) {
      return
    }

    const hasSelectedDeck = deckOptions.some((deck) => deck.id === generationDeckId)

    if (!hasSelectedDeck) {
      setGenerationDeckId(activeDeck.id)
    }
  }, [activeDeck.id, deckOptions, generationDeckId])

  const agent = useAgent({
    agent: 'MochiCardAgent',
    name: 'default',
    basePath: 'api/agents/mochi-card-agent/default',
  })
  const { messages, sendMessage, clearHistory, status, error } = useAgentChat({
    agent,
  })
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant')
  const latestAssistantText = latestAssistantMessage
    ? extractMessageText(latestAssistantMessage.parts)
    : ''
  const isGenerating = status === 'submitted' || status === 'streaming'
  const promptError =
    error ??
    (generationError ? new Error(generationError) : null) ??
    (examplesError ? new Error(examplesError) : null)
  const exampleCount = Math.min(exampleCards.length, GENERATION_EXAMPLE_CARD_COUNT)

  useEffect(() => {
    if (!latestAssistantText.trim()) {
      return
    }

    const { proposedCards: nextProposals, filteredCount } = buildGeneratedCardProposals(
      latestAssistantText,
      lastSubmissionDuplicateKeys,
      lastSubmittedDeckId
    )
    const syncSignature = JSON.stringify({
      filteredCount,
      proposals: nextProposals,
    })

    if (lastProposalSyncSignatureRef.current === syncSignature) {
      return
    }

    lastProposalSyncSignatureRef.current = syncSignature

    setLastFilteredDuplicateCount(filteredCount)
    setProposedCards(nextProposals)
  }, [latestAssistantText, lastSubmissionDuplicateKeys, lastSubmittedDeckId])

  function resetProposalSync() {
    lastProposalSyncSignatureRef.current = ''
  }

  function clearGeneratedCards() {
    clearHistory()
    resetProposalSync()
    setProposedCards([])
    setLastFilteredDuplicateCount(0)
  }

  function resetGenerationState() {
    clearGeneratedCards()
    setPrompt('')
    setGenerationError(null)
    setLastSubmissionDuplicateKeys(new Set())
    setLastSubmittedDeckId('')
  }

  async function submitPrompt(messageText: string) {
    const nextPrompt = messageText.trim()

    if (!nextPrompt || isGenerating || selectedGenerationDeck.kind !== 'deck') {
      return
    }

    setGenerationError(null)

    let duplicateKeys = new Set<string>()

    try {
      const existingCards = await fetchDeckCards(selectedGenerationDeck.id)
      duplicateKeys = buildExistingCardDuplicateKeySet(existingCards)
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : 'Failed to fetch cards for duplicate filtering'
      )
      return
    }

    const promptWithContext = buildGenerationPrompt({
      language: selectedLanguage,
      deckName: selectedGenerationDeck.name.trim(),
      examples: pickExampleCards(exampleCards, GENERATION_EXAMPLE_CARD_COUNT),
      userPrompt: nextPrompt,
    })

    clearGeneratedCards()
    setLastSubmissionDuplicateKeys(duplicateKeys)
    setLastSubmittedDeckId(selectedGenerationDeck.id)
    await sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: promptWithContext }],
    })
  }

  function handleShowGenerateView() {
    setMainView('generate')
    setGenerationDeckId(activeDeck.id)
    textareaRef.current?.focus()
  }

  function handleToggleCardSelection(cardId: string) {
    setProposedCards((current) => togglePendingCardSelection(current, cardId))
  }

  function handleDeselectAllCards() {
    setProposedCards((current) => deselectPendingCards(current))
  }

  function handleClearPendingCards() {
    const hasPendingCards = proposedCards.some((card) => card.status !== 'approved')

    if (!hasPendingCards || isApprovingCards) {
      return
    }

    const shouldClear = window.confirm(
      'Clear all pending proposed cards? This will remove any proposals that have not been added to Mochi yet.'
    )

    if (!shouldClear) {
      return
    }

    clearHistory()
    resetProposalSync()
    setProposedCards((current) => keepApprovedCards(current))
  }

  async function handleApproveSelectedCards() {
    const cardsToApprove = proposedCards.filter((card) => card.status === 'pending' && card.isSelected)

    if (cardsToApprove.length === 0 || isApprovingCards) {
      return
    }

    setIsApprovingCards(true)
    setProposedCards((current) => markSelectedCardsSubmitting(current))

    try {
      for (const targetCard of cardsToApprove) {
        try {
          await createDeckCard(targetCard.deckId, targetCard)
          setProposedCards((current) => markCardApproved(current, targetCard.id))
        } catch (err) {
          setProposedCards((current) =>
            markCardError(
              current,
              targetCard.id,
              err instanceof Error ? err.message : 'Failed to create card'
            )
          )
        }
      }
    } finally {
      setIsApprovingCards(false)
    }
  }

  function handleClearGenerationState() {
    resetGenerationState()
  }

  function handleSelectDeck(deckId: string) {
    setDecks((currentDecks) => activateDeck(currentDecks, deckId))
    setMainView('deck')
  }

  return (
    <div className="flex h-full w-full bg-[#262626] text-left font-sans text-[#e0e0e0] antialiased">
      <AppSidebar
        decks={decks}
        decksLoading={decksLoading}
        decksError={decksError}
        decksRefreshedAt={decksRefreshedAt}
        onRefreshDecks={refreshDecks}
        activeScreen={mainView}
        activeDeckId={activeDeck.id}
        onGenerateCards={handleShowGenerateView}
        onSettingsClick={() => setMainView('settings')}
        onCreateDeck={() => {}}
        onSelectDeck={handleSelectDeck}
        onToggleDeck={(deckId) => setDecks((currentDecks) => toggleDeck(currentDecks, deckId))}
      />

      <main className="relative flex h-full flex-1 overflow-hidden bg-[#282828] px-8 py-8">
        {mainView === 'generate' ? (
          <GenerateView
            language={selectedLanguage}
            languageOptions={LANGUAGE_OPTIONS}
            deckId={selectedGenerationDeck.id}
            deckOptions={deckOptions}
            prompt={prompt}
            onLanguageChange={setSelectedLanguage}
            onDeckChange={setGenerationDeckId}
            onPromptChange={setPrompt}
            onSubmit={() => void submitPrompt(prompt)}
            onClear={handleClearGenerationState}
            onApproveSelected={() => void handleApproveSelectedCards()}
            onClearPendingCards={handleClearPendingCards}
            onDeselectAllCards={handleDeselectAllCards}
            onToggleCardSelection={handleToggleCardSelection}
            textareaRef={textareaRef}
            isGenerating={isGenerating}
            isApprovingCards={isApprovingCards}
            isLoadingExamples={examplesLoading}
            exampleCount={exampleCount}
            filteredDuplicateCount={lastFilteredDuplicateCount}
            proposedCards={proposedCards}
            error={promptError}
          />
        ) : mainView === 'settings' ? (
          <SettingsView />
        ) : (
          <DeckView deck={activeDeck} />
        )}
      </main>
    </div>
  )
}
