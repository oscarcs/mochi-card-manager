import type { RefObject } from 'react'

import { extractMessageText } from '../../lib/cardGeneration'
import type { GeneratedCard } from '../../types/cards'

type AgentMessage = {
  id: string
  role: string
  parts: Array<{ type: string } & Record<string, unknown>>
}

export type GenerateViewProps = {
  deckName: string
  prompt: string
  onPromptChange: (value: string) => void
  onSubmit: () => void
  onClear: () => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
  isGenerating: boolean
  messages: AgentMessage[]
  generatedCards: GeneratedCard[]
  error: unknown
}

function GenerateMessages({ messages }: { messages: AgentMessage[] }) {
  if (messages.length === 0) {
    return (
      <p className="text-sm leading-6 text-[#8F8F8F]">
        Describe the concept set, source language, tone, difficulty, or card count.
      </p>
    )
  }

  return (
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
  )
}

function GeneratedCardsPanel({
  deckName,
  generatedCards,
}: {
  deckName: string
  generatedCards: GeneratedCard[]
}) {
  return (
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
  )
}

export function GenerateView({
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
            <GenerateMessages messages={messages} />
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

      <GeneratedCardsPanel deckName={deckName} generatedCards={generatedCards} />
    </section>
  )
}
