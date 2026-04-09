import { routeAgentRequest } from 'agents'

import { MochiCardAgent } from './agents/mochi-card-agent'

export { MochiCardAgent }

const AGENT_PREFIX = '/api/agents'
const MOCHI_API_BASE = 'https://app.mochi.cards/api'

async function mochiApiFetch(
  path: string,
  apiKey: string,
  params?: Record<string, string>
): Promise<Response> {
  const url = new URL(`${MOCHI_API_BASE}${path}`)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ':')}`,
      Accept: 'application/json',
    },
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
        ...(url.searchParams.get('bookmark')
          ? { bookmark: url.searchParams.get('bookmark')! }
          : {}),
      })
    }

    if (url.pathname === '/api/cards') {
      const deckId = url.searchParams.get('deck-id')

      if (!deckId) {
        return Response.json({ error: 'deck-id is required' }, { status: 400 })
      }

      const params: Record<string, string> = { 'deck-id': deckId }
      const bookmark = url.searchParams.get('bookmark')
      const limit = url.searchParams.get('limit')

      if (bookmark) params.bookmark = bookmark
      if (limit) params.limit = limit

      return mochiApiFetch('/cards/', env.MOCHI_API_KEY, params)
    }

    return new Response(null, { status: 404 })
  },
} satisfies ExportedHandler<Env>
