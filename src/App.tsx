import { useCallback, useEffect, useRef, useState } from 'react'
import { useAgent } from 'agents/react'
import { useAgentChat } from 'agents/ai-react'

import { AppSidebar } from './components/AppSidebar'
import { DeckView } from './components/views/DeckView'
import { GenerateView } from './components/views/GenerateView'
import { SettingsView } from './components/views/SettingsView'
import {
  buildExistingCardDuplicateKeySet,
  buildGenerationPrompt,
  extractCardsFromAssistantResponse,
  extractMessageText,
  filterDuplicateGeneratedCards,
  pickExampleCards,
} from './lib/cardGeneration'
import { activateDeck, buildDeckTree, findActiveDeck, findNodeById, toggleDeck } from './lib/deckTree'
import type { ProposedCard } from './types/cards'
import type { DeckTreeNode, MainView, MochiCard, MochiDeck, MochiListResponse } from './types/decks'

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

function flattenDeckOptions(nodes: DeckTreeNode[], depth = 0): DeckTreeNode[] {
  return nodes.flatMap((node) => {
    if (node.kind !== 'deck') {
      return []
    }

    const option: DeckTreeNode = {
      ...node,
      name: `${'  '.repeat(depth)}${node.name}`,
      children: undefined,
    }

    return [option, ...(node.children ? flattenDeckOptions(node.children, depth + 1) : [])]
  })
}

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
  const [exampleCards, setExampleCards] = useState<MochiCard[]>([])
  const [examplesLoading, setExamplesLoading] = useState(false)
  const [examplesError, setExamplesError] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [lastSubmissionDuplicateKeys, setLastSubmissionDuplicateKeys] = useState<Set<string>>(() => new Set())
  const [lastFilteredDuplicateCount, setLastFilteredDuplicateCount] = useState(0)
  const [proposedCards, setProposedCards] = useState<ProposedCard[]>([])
  const [isApprovingCards, setIsApprovingCards] = useState(false)
  const [lastSubmittedDeckId, setLastSubmittedDeckId] = useState<string>('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
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
      const allDecks: MochiDeck[] = []
      let bookmark: string | undefined

      do {
        const params = bookmark ? `?bookmark=${bookmark}` : ''
        const res = await fetch(`/api/decks${params}`)

        if (!res.ok) {
          throw new Error(`Failed to fetch decks: ${res.status}`)
        }

        const data: MochiListResponse<MochiDeck> = await res.json()
        allDecks.push(...data.docs)
        bookmark = data.docs.length > 0 ? data.bookmark : undefined
      } while (bookmark)

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

  useEffect(() => {
    if (!deckOptions.length) {
      return
    }

    const hasSelectedDeck = deckOptions.some((deck) => deck.id === generationDeckId)

    if (!hasSelectedDeck) {
      setGenerationDeckId(activeDeck.id)
    }
  }, [activeDeck.id, deckOptions, generationDeckId])

  useEffect(() => {
    if (!generationDeckId) {
      setExampleCards([])
      return
    }

    let isMounted = true

    async function fetchExampleCards() {
      setExamplesLoading(true)
      setExamplesError(null)

      try {
        const params = new URLSearchParams({
          'deck-id': generationDeckId,
          limit: '60',
        })
        const res = await fetch(`/api/cards?${params.toString()}`)

        if (!res.ok) {
          throw new Error(`Failed to fetch example cards: ${res.status}`)
        }

        const data = (await res.json()) as MochiListResponse<MochiCard>

        if (isMounted) {
          setExampleCards(data.docs)
        }
      } catch (err) {
        if (isMounted) {
          setExampleCards([])
          setExamplesError(err instanceof Error ? err.message : 'Failed to load example cards')
        }
      } finally {
        if (isMounted) {
          setExamplesLoading(false)
        }
      }
    }

    void fetchExampleCards()

    return () => {
      isMounted = false
    }
  }, [generationDeckId])

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
  const generatedCards = extractCardsFromAssistantResponse(latestAssistantText)
  const isGenerating = status === 'submitted' || status === 'streaming'
  const promptError =
    error ??
    (generationError ? new Error(generationError) : null) ??
    (examplesError ? new Error(examplesError) : null)
  const exampleCount = Math.min(exampleCards.length, GENERATION_EXAMPLE_CARD_COUNT)

  useEffect(() => {
    const { uniqueCards, filteredCount } = filterDuplicateGeneratedCards(
      generatedCards,
      lastSubmissionDuplicateKeys
    )

    setLastFilteredDuplicateCount(filteredCount)
    setProposedCards(
      uniqueCards.map((card, index) => ({
        ...card,
        id: `proposal-${Date.now()}-${index}`,
        deckId: lastSubmittedDeckId,
        isSelected: true,
        status: 'pending',
      }))
    )
  }, [generatedCards, lastSubmissionDuplicateKeys, lastSubmittedDeckId])

  async function fetchAllDeckCards(deckId: string) {
    const allCards: MochiCard[] = []
    let bookmark: string | undefined

    do {
      const params = new URLSearchParams({ 'deck-id': deckId })

      if (bookmark) {
        params.set('bookmark', bookmark)
      }

      const res = await fetch(`/api/cards?${params.toString()}`)

      if (!res.ok) {
        throw new Error(`Failed to fetch cards for duplicate filtering: ${res.status}`)
      }

      const data = (await res.json()) as MochiListResponse<MochiCard>
      allCards.push(...data.docs)
      bookmark = data.docs.length > 0 ? data.bookmark : undefined
    } while (bookmark)

    return allCards
  }

  async function submitPrompt(messageText: string) {
    const nextPrompt = messageText.trim()

    if (!nextPrompt || isGenerating || !selectedGenerationDeck || selectedGenerationDeck.kind !== 'deck') {
      return
    }

    setGenerationError(null)

    let existingCards: MochiCard[]

    try {
      existingCards = await fetchAllDeckCards(selectedGenerationDeck.id)
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

    clearHistory()
    setProposedCards([])
    setLastFilteredDuplicateCount(0)
    setLastSubmissionDuplicateKeys(buildExistingCardDuplicateKeySet(existingCards))
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
    setProposedCards((current) =>
      current.map((card) =>
        card.id === cardId && card.status === 'pending'
          ? {
              ...card,
              isSelected: !card.isSelected,
              error: undefined,
            }
          : card
      )
    )
  }

  function handleDeselectAllCards() {
    setProposedCards((current) =>
      current.map((card) =>
        card.status === 'pending'
          ? {
              ...card,
              isSelected: false,
              error: undefined,
            }
          : card
      )
    )
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
    setProposedCards((current) => current.filter((card) => card.status === 'approved'))
  }

  async function handleApproveSelectedCards() {
    const cardsToApprove = proposedCards.filter((card) => card.status === 'pending' && card.isSelected)

    if (cardsToApprove.length === 0 || isApprovingCards) {
      return
    }

    setIsApprovingCards(true)
    setProposedCards((current) =>
      current.map((card) =>
        card.status === 'pending' && card.isSelected
          ? {
              ...card,
              status: 'submitting',
              error: undefined,
            }
          : card
      )
    )

    try {
      for (const targetCard of cardsToApprove) {
        try {
          const res = await fetch('/api/cards', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deckId: targetCard.deckId,
              card: {
                front: targetCard.front,
                back: targetCard.back,
                notes: targetCard.notes,
              },
            }),
          })

          if (!res.ok) {
            const payload = (await res.json().catch(() => null)) as { error?: string } | null
            throw new Error(payload?.error ?? `Failed to create card: ${res.status}`)
          }

          setProposedCards((current) =>
            current.map((card) =>
              card.id === targetCard.id
                ? {
                    ...card,
                    status: 'approved',
                    isSelected: false,
                    error: undefined,
                  }
                : card
            )
          )
        } catch (err) {
          setProposedCards((current) =>
            current.map((card) =>
              card.id === targetCard.id
                ? {
                    ...card,
                    status: 'pending',
                    error: err instanceof Error ? err.message : 'Failed to create card',
                  }
                : card
            )
          )
        }
      }
    } finally {
      setIsApprovingCards(false)
    }
  }

  function handleClearGenerationState() {
    clearHistory()
    setPrompt('')
    setProposedCards([])
    setGenerationError(null)
    setLastFilteredDuplicateCount(0)
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
        onSelectDeck={(deckId) => {
          const nextDecks = activateDeck(decks, deckId)
          setDecks(nextDecks)
          setMainView('deck')
        }}
        onToggleDeck={(deckId) => setDecks((currentDecks) => toggleDeck(currentDecks, deckId))}
      />

      <main className="relative flex h-full flex-1 overflow-hidden bg-[#282828] px-8 py-8">
        {mainView === 'generate' ? (
          <GenerateView
            language={selectedLanguage}
            languageOptions={LANGUAGE_OPTIONS}
            deckId={selectedGenerationDeck?.id ?? ''}
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
