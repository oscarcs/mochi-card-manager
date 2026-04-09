import { useRef, useState } from 'react'
import { useAgent } from 'agents/react'
import { useAgentChat } from 'agents/ai-react'

import { AppSidebar } from './components/AppSidebar'
import { DeckView } from './components/views/DeckView'
import { GenerateView } from './components/views/GenerateView'
import { SettingsView } from './components/views/SettingsView'
import { mockDecks } from './data/mockDecks'
import { buildStarterPrompt, extractCardsFromAssistantResponse, extractMessageText } from './lib/cardGeneration'
import { activateDeck, findActiveDeck, findNodeById, toggleDeck } from './lib/deckTree'
import type { MainView } from './types/decks'

export default function App() {
  const [decks, setDecks] = useState(mockDecks)
  const [mainView, setMainView] = useState<MainView>('deck')
  const [prompt, setPrompt] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const activeDeck = findActiveDeck(decks) ?? mockDecks[0]
  const agent = useAgent({
    agent: 'MochiCardAgent',
    name: 'default',
    basePath: '/api/agents/mochi-card-agent/default',
  })
  const { messages, sendMessage, clearHistory, status, error } = useAgentChat({
    agent,
    body: {
      deckId: activeDeck.id,
      deckName: activeDeck.name,
    },
  })
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant')
  const latestAssistantText = latestAssistantMessage
    ? extractMessageText(latestAssistantMessage.parts)
    : ''
  const generatedCards = extractCardsFromAssistantResponse(latestAssistantText)
  const isGenerating = status === 'submitted' || status === 'streaming'

  async function submitPrompt(messageText: string) {
    const nextPrompt = messageText.trim()

    if (!nextPrompt || isGenerating) {
      return
    }

    await sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: nextPrompt }],
    })

    setPrompt('')
  }

  function handleShowGenerateView() {
    setMainView('generate')

    if (!prompt.trim()) {
      setPrompt(buildStarterPrompt(activeDeck.name))
    }

    textareaRef.current?.focus()
  }

  return (
    <div className="flex h-full w-full bg-[#262626] text-[#e0e0e0] font-sans antialiased text-left select-none">
      <AppSidebar
        decks={decks}
        activeScreen={mainView}
        activeDeckId={activeDeck.id}
        onGenerateCards={handleShowGenerateView}
        onSettingsClick={() => setMainView('settings')}
        onCreateDeck={() => {}}
        onSelectDeck={(deckId) => {
          const nextDecks = activateDeck(decks, deckId)
          const nextDeck = findNodeById(nextDecks, deckId)

          setDecks(nextDecks)
          setMainView('deck')

          if (nextDeck?.kind === 'deck') {
            setPrompt(buildStarterPrompt(nextDeck.name))
          }
        }}
        onToggleDeck={(deckId) => setDecks((currentDecks) => toggleDeck(currentDecks, deckId))}
      />

      <main className="relative flex h-full flex-1 overflow-hidden bg-[#282828] px-8 py-8">
        {mainView === 'generate' ? (
          <GenerateView
            deckName={activeDeck.name}
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={() => void submitPrompt(prompt)}
            onClear={clearHistory}
            textareaRef={textareaRef}
            isGenerating={isGenerating}
            messages={messages}
            generatedCards={generatedCards}
            error={error}
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
