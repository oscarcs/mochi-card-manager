import { AIChatAgent } from '@cloudflare/ai-chat'
import {
  convertToModelMessages,
  type ModelMessage,
  streamText,
  type StreamTextOnFinishCallback,
  type ToolSet,
} from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

type MochiCardAgentState = {
  lastFetchedUrls: string[]
}

const MAX_FETCHED_URLS = 3
const URL_CONTEXT_CHAR_LIMIT = 12000

const SYSTEM_PROMPT = `You generate high-quality language learning flashcards for Mochi.

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
- Prefer 12 cards unless the user explicitly asks for a different count.
- Keep "front" and "back" short.
- Use "notes" very sparingly and only when there is a linguistic ambiguity that needs to be noted.
- Use vocabulary and example sentences from URL content when it is available.
- Do not include any prose before or after the JSON block.`

function extractTextParts(
  content: ModelMessage['content']
): Array<{ type: 'text'; text: string }> {
  if (typeof content === 'string' || !Array.isArray(content)) {
    return []
  }

  return content.filter(
    (part): part is { type: 'text'; text: string } =>
      part.type === 'text' && typeof part.text === 'string'
  )
}

function extractLatestUserText(messages: ModelMessage[]) {
  const latestUserContent = [...messages].reverse().find((message) => message.role === 'user')?.content

  if (!latestUserContent) {
    return ''
  }

  if (typeof latestUserContent === 'string') {
    return latestUserContent
  }

  return extractTextParts(latestUserContent)
    .map((part) => part.text)
    .join('')
}

function extractUrls(value: string) {
  return [...new Set(value.match(/https?:\/\/[^\s)]+/g) ?? [])]
}

function stripHtml(html: string) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<main[^>]*>/gi, ' ')
    .replace(/<\/main>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeFetchedText(contentType: string, rawText: string) {
  return contentType.includes('html') ? stripHtml(rawText) : rawText.trim()
}

async function fetchUrlExcerpt(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MochiCardManager/1.0',
      },
    })

    if (!response.ok) {
      return { url, error: `HTTP ${response.status}` }
    }

    const contentType = response.headers.get('content-type') ?? ''
    const rawText = await response.text()
    const cleanedText = normalizeFetchedText(contentType, rawText)

    return {
      url,
      text: cleanedText.slice(0, URL_CONTEXT_CHAR_LIMIT),
    }
  } catch (error) {
    return {
      url,
      error: error instanceof Error ? error.message : 'Request failed',
    }
  }
}

function formatUrlContext(results: Array<{ url: string; text: string }>) {
  return results
    .map(
      (result, index) =>
        `Source ${index + 1}: ${result.url}\nRetrieved content excerpt:\n${result.text}`
    )
    .join('\n\n')
}

async function fetchUrlContext(urls: string[]) {
  const results = await Promise.all(urls.slice(0, MAX_FETCHED_URLS).map((url) => fetchUrlExcerpt(url)))
  const successfulResults = results.filter(
    (result): result is { url: string; text: string } => 'text' in result && !!result.text
  )

  if (successfulResults.length === 0) {
    return ''
  }

  return formatUrlContext(successfulResults)
}

function buildSystemPrompt(urlContext: string) {
  return [SYSTEM_PROMPT, urlContext ? `Retrieved URL context:\n${urlContext}` : null]
    .filter(Boolean)
    .join('\n\n')
}

function buildAgentState(urls: string[]): MochiCardAgentState {
  return {
    lastFetchedUrls: urls,
  }
}

export class MochiCardAgent extends AIChatAgent<Env, MochiCardAgentState> {
  initialState: MochiCardAgentState = {
    lastFetchedUrls: [],
  }

  messageConcurrency = 'latest' as const
  maxPersistedMessages = 20

  async onChatMessage(onFinish: StreamTextOnFinishCallback<ToolSet>) {
    const workersai = createWorkersAI({ binding: this.env.AI })
    const modelMessages = await convertToModelMessages(this.messages)
    const latestUserText = extractLatestUserText(modelMessages)
    const urls = extractUrls(latestUserText)
    const urlContext = await fetchUrlContext(urls)

    this.setState(buildAgentState(urls))

    const result = streamText({
      model: workersai('@cf/moonshotai/kimi-k2.5'),
      system: buildSystemPrompt(urlContext),
      messages: modelMessages,
      onFinish,
    })

    return result.toUIMessageStreamResponse()
  }
}
