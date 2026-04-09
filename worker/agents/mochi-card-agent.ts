import { AIChatAgent, type OnChatMessageOptions } from '@cloudflare/ai-chat'
import { convertToModelMessages, streamText, type StreamTextOnFinishCallback, type ToolSet } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

type GenerationRequest = {
  deckId?: string
  deckName?: string
}

type MochiCardAgentState = {
  lastDeckId: string | null
  lastDeckName: string | null
}

const SYSTEM_PROMPT = `You generate high-quality flashcards for Mochi.

Return only JSON inside a \`\`\`json code block.

The JSON must follow this shape:
{
  "deckName": "string",
  "cards": [
    {
      "front": "string",
      "back": "string",
      "notes": "string"
    }
  ]
}

Rules:
- Generate concise cards that test recall, not recognition.
- Prefer 4 to 8 cards unless the user explicitly asks for a different count.
- Keep "front" and "back" short.
- Use "notes" for nuance, examples, or usage guidance.
- Do not include any prose before or after the JSON block.`

export class MochiCardAgent extends AIChatAgent<Env, MochiCardAgentState> {
  initialState: MochiCardAgentState = {
    lastDeckId: null,
    lastDeckName: null,
  }

  messageConcurrency = 'latest' as const
  maxPersistedMessages = 20

  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: OnChatMessageOptions
  ) {
    const workersai = createWorkersAI({ binding: this.env.AI })
    const request = (options?.body ?? {}) as GenerationRequest

    this.setState({
      lastDeckId: request.deckId ?? null,
      lastDeckName: request.deckName ?? null,
    })

    const deckPrompt = request.deckName
      ? `Target deck: ${request.deckName}.`
      : 'Target deck: Unspecified.'

    const result = streamText({
      model: workersai('@cf/moonshotai/kimi-k2.5'),
      system: `${SYSTEM_PROMPT}\n\n${deckPrompt}`,
      messages: await convertToModelMessages(this.messages),
      onFinish,
    })

    return result.toUIMessageStreamResponse()
  }
}
