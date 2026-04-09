import { useRef, useState } from 'react'
import { useAgent } from 'agents/react'
import { useAgentChat } from 'agents/ai-react'

import { AppSidebar } from './components/AppSidebar'
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

type MainView = 'deck' | 'generate' | 'settings'

type GeneratedCard = {
  front: string
  back: string
  notes?: string
}

function mapDeckTree(
  nodes: DeckTreeNode[],
  updater: (node: DeckTreeNode) => DeckTreeNode
): DeckTreeNode[] {
  return nodes.map((node) => ({
    ...updater(node),
    children: node.children ? mapDeckTree(node.children, updater) : undefined,
  }))
}

function activateDeck(nodes: DeckTreeNode[], activeId: string): DeckTreeNode[] {
  return mapDeckTree(nodes, (node) => ({
    ...node,
    isActive: node.id === activeId,
  }))
}

function toggleDeck(nodes: DeckTreeNode[], deckId: string): DeckTreeNode[] {
  return mapDeckTree(nodes, (node) =>
    node.id === deckId && node.kind === 'deck'
      ? {
          ...node,
          isExpanded: !node.isExpanded,
        }
      : node
  )
}

function findNodeById(nodes: DeckTreeNode[], id: string): DeckTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }

    if (node.children?.length) {
      const childNode = findNodeById(node.children, id)

      if (childNode) {
        return childNode
      }
    }
  }

  return null
}

function findActiveDeck(nodes: DeckTreeNode[]): DeckTreeNode | null {
  for (const node of nodes) {
    if (node.isActive) {
      return node
    }

    if (node.children?.length) {
      const activeChild = findActiveDeck(node.children)

      if (activeChild) {
        return activeChild
      }
    }
  }

  return null
}

function SettingsView() {
  return (
    <section className="mx-auto flex h-full w-full max-w-[1100px] flex-col rounded-[16px] border border-[#363636] bg-[#242424] p-6 shadow-2xl">
      <div className="border-b border-[#303030] pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#767676]">
          Settings
        </p>
        <h1 className="mt-2 text-[24px] font-semibold text-[#F2F2F2]">Settings</h1>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[#6F6F6F]">Settings UI not implemented yet.</p>
      </div>
    </section>
  )
}

function buildStarterPrompt(deckName: string) {
  return `Create 5 flashcards for the "${deckName}" deck. Focus on practical recall, short answers, and add brief notes when useful.`
}

function extractMessageText(parts: Array<{ type: string } & Record<string, unknown>>) {
  return parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text as string)
    .join('')
}

function extractCardsFromAssistantResponse(response: string): GeneratedCard[] {
  const codeBlockMatch = response.match(/```json\s*([\s\S]*?)```/i)
  const jsonText = codeBlockMatch?.[1]?.trim() ?? response.trim()

  if (!jsonText) {
    return []
  }

  try {
    const parsed = JSON.parse(jsonText) as {
      cards?: Array<Record<string, unknown>>
    }

    if (!Array.isArray(parsed.cards)) {
      return []
    }

    return parsed.cards
      .map<GeneratedCard | null>((card) => {
        const front = typeof card.front === 'string' ? card.front : null
        const back = typeof card.back === 'string' ? card.back : null
        const notes = typeof card.notes === 'string' ? card.notes : undefined

        if (!front || !back) {
          return null
        }

        return { front, back, notes }
      })
      .filter((card): card is GeneratedCard => card !== null)
  } catch {
    return []
  }
}

function DeckView({ deck }: { deck: DeckTreeNode | null }) {
  return (
    <section className="mx-auto flex h-full w-full max-w-[1100px] flex-col rounded-[16px] border border-[#363636] bg-[#242424] p-6 shadow-2xl">
      <div className="border-b border-[#303030] pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#767676]">
          Deck Preview
        </p>
        <h1 className="mt-2 text-[24px] font-semibold text-[#F2F2F2]">
          {deck?.name ?? 'No deck selected'}
        </h1>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[#6F6F6F]">Deck preview UI not implemented yet.</p>
      </div>
    </section>
  )
}

type GenerateViewProps = {
  deckName: string
  prompt: string
  onPromptChange: (value: string) => void
  onSubmit: () => void
  onClear: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  isGenerating: boolean
  messages: Array<{
    id: string
    role: string
    parts: Array<{ type: string } & Record<string, unknown>>
  }>
  generatedCards: GeneratedCard[]
  error: unknown
}

function GenerateView({
  deckName,
  prompt,
  onPromptChange,
  onSubmit,
  onClear,
  textareaRef,
  isGenerating,
  messages,
  generatedCards,
  error,
}: GenerateViewProps) {
  return (
    <section className="mx-auto flex h-full w-full max-w-[1100px] gap-6">
      <div className="flex min-w-0 flex-[1.15] flex-col rounded-[16px] border border-[#363636] bg-[#242424] p-6 shadow-2xl">
        <div className="border-b border-[#303030] pb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#767676]">
            Generate Cards
          </p>
          <h1 className="mt-2 text-[24px] font-semibold text-[#F2F2F2]">
            Card agent workspace
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#AAAAAA]">
            Ask the agent to draft flashcards for <span className="text-[#F0F0F0]">{deckName}</span>.
          </p>
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4">
          <div className="min-h-0 flex-1 overflow-y-auto rounded-[12px] border border-[#313131] bg-[#202020] px-4 py-3">
            {messages.length === 0 ? (
              <p className="text-sm leading-6 text-[#8F8F8F]">
                Describe the concept set, source language, tone, difficulty, or card count.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#6F6F6F]">
                      {message.role}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[#D8D8D8]">
                      {extractMessageText(message.parts)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[12px] border border-[#343434] bg-[#1F1F1F] p-4">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              rows={6}
              placeholder={`Create 5 cards for ${deckName}...`}
              className="w-full resize-none bg-transparent text-sm leading-6 text-[#EFEFEF] outline-none placeholder:text-[#6C6C6C]"
            />

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-[#8D8D8D]">
                {error instanceof Error
                  ? error.message
                  : isGenerating
                    ? 'Generating cards…'
                    : 'Agent responses are parsed into cards on the right.'}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-md border border-[#3B3B3B] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9C9C9C] transition-colors hover:bg-[#2E2E2E] hover:text-[#E4E4E4]"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isGenerating || !prompt.trim()}
                  className="rounded-md bg-[#E7E2D2] px-4 py-2 text-sm font-semibold text-[#1E1E1E] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? 'Generating…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-w-[320px] flex-1 flex-col rounded-[16px] border border-[#363636] bg-[#242424] p-6 shadow-2xl">
        <div className="border-b border-[#303030] pb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#767676]">
            Generated Cards
          </p>
          <p className="mt-2 text-sm text-[#AAAAAA]">
            Latest parsed card set for <span className="text-[#F0F0F0]">{deckName}</span>.
          </p>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
          {generatedCards.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-[12px] border border-dashed border-[#343434] bg-[#202020]">
              <p className="text-sm text-[#6F6F6F]">No cards generated yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {generatedCards.map((card, index) => (
                <article
                  key={`${card.front}-${index}`}
                  className="rounded-[12px] border border-[#343434] bg-[#202020] p-4"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#707070]">
                    Card {index + 1}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8A8A]">
                    Front
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#F1F1F1]">{card.front}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8A8A]">
                    Back
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#D5D5D5]">{card.back}</p>
                  {card.notes ? (
                    <>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8A8A]">
                        Notes
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#9F9F9F]">{card.notes}</p>
                    </>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

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
