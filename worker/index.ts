import { routeAgentRequest } from 'agents'

import { MochiCardAgent } from './agents/mochi-card-agent'
import type { GeneratedCard } from '../src/types/cards'
import { buildMochiCardContent } from '../src/lib/mochiCards'

export { MochiCardAgent }

const AGENT_PREFIX = '/api/agents'
const MOCHI_API_BASE = 'https://app.mochi.cards/api'

async function mochiApiFetch(
  path: string,
  apiKey: string,
  options?: {
    params?: Record<string, string>
    method?: 'GET' | 'POST'
    body?: unknown
  }
): Promise<Response> {
  const url = new URL(`${MOCHI_API_BASE}${path}`)
  const params = options?.params

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url.toString(), {
    method: options?.method ?? 'GET',
    headers: {
      Authorization: `Basic ${btoa(apiKey + ':')}`,
      Accept: 'application/json',
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  })

  if (!response.ok) {
    return Response.json(
      { error: `Mochi API error: ${response.status}` },
      { status: response.status }
    )
  }

  const data = await response.json()
  return Response.json(data)
}

export default {
  async fetch(request: Request, env: Env) {
    const agentResponse = await routeAgentRequest(request, env, {
      prefix: AGENT_PREFIX,
    })

    if (agentResponse) {
      return agentResponse
    }

    const url = new URL(request.url)

    if (url.pathname === '/api/health') {
      return Response.json({
        ok: true,
        backend: 'cloudflare-agent',
        agent: 'MochiCardAgent',
        agentPrefix: AGENT_PREFIX,
        defaultInstance: 'default',
        mode: 'chat-agent',
      })
    }

    if (url.pathname === '/api/decks') {
      return mochiApiFetch('/decks/', env.MOCHI_API_KEY, {
        params: {
          ...(url.searchParams.get('bookmark')
            ? { bookmark: url.searchParams.get('bookmark')! }
            : {}),
        },
      })
    }

    if (url.pathname === '/api/cards') {
      if (request.method === 'POST') {
        const body = (await request.json().catch(() => null)) as
          | {
              deckId?: string
              card?: GeneratedCard
            }
          | null

        if (!body?.deckId || !body.card?.front?.trim() || !body.card?.back?.trim()) {
          return Response.json(
            { error: 'deckId, card.front, and card.back are required' },
            { status: 400 }
          )
        }

        return mochiApiFetch('/cards/', env.MOCHI_API_KEY, {
          method: 'POST',
          body: {
            'deck-id': body.deckId,
            content: buildMochiCardContent(body.card),
          },
        })
      }

      const deckId = url.searchParams.get('deck-id')

      if (!deckId) {
        return Response.json({ error: 'deck-id is required' }, { status: 400 })
      }

      const params: Record<string, string> = { 'deck-id': deckId }
      const bookmark = url.searchParams.get('bookmark')
      const limit = url.searchParams.get('limit')

      if (bookmark) params.bookmark = bookmark
      if (limit) params.limit = limit

      return mochiApiFetch('/cards/', env.MOCHI_API_KEY, { params })
    }

    return new Response(null, { status: 404 })
  },
} satisfies ExportedHandler<Env>
