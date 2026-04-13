import { routeAgentRequest } from 'agents'

import { MochiCardAgent } from './agents/mochi-card-agent'
import type { GeneratedCard } from '../src/types/cards'
import { buildMochiCardContent } from '../src/lib/mochiCards'
import { proxyMochiApiJson } from './lib/mochiApi'

export { MochiCardAgent }

const AGENT_PREFIX = 'api/agents'
const HEALTH_RESPONSE = {
  ok: true,
  backend: 'cloudflare-agent',
  agent: 'MochiCardAgent',
  agentPrefix: AGENT_PREFIX,
  defaultInstance: 'default',
  mode: 'chat-agent',
}

type CreateCardRequestBody = {
  deckId?: string
  card?: GeneratedCard
}

function getOptionalSearchParam(url: URL, key: string) {
  return url.searchParams.get(key) ?? undefined
}

function buildDeckQueryParams(url: URL) {
  const bookmark = getOptionalSearchParam(url, 'bookmark')
  return bookmark ? { bookmark } : undefined
}

function buildCardQueryParams(url: URL, deckId: string) {
  const params: Record<string, string> = { 'deck-id': deckId }
  const bookmark = getOptionalSearchParam(url, 'bookmark')
  const limit = getOptionalSearchParam(url, 'limit')

  if (bookmark) {
    params.bookmark = bookmark
  }

  if (limit) {
    params.limit = limit
  }

  return params
}

async function parseCreateCardRequest(request: Request) {
  const body = (await request.json().catch(() => null)) as CreateCardRequestBody | null

  if (!body?.deckId || !body.card?.front?.trim() || !body.card?.back?.trim()) {
    return null
  }

  return {
    deckId: body.deckId,
    card: {
      front: body.card.front.trim(),
      back: body.card.back.trim(),
      ...(body.card.notes?.trim() ? { notes: body.card.notes.trim() } : {}),
    },
  }
}

function handleHealthRequest() {
  return Response.json(HEALTH_RESPONSE)
}

function handleDeckListRequest(url: URL, env: Env) {
  return proxyMochiApiJson('/decks/', env.MOCHI_API_KEY, {
    params: buildDeckQueryParams(url),
  })
}

async function handleCardCreateRequest(request: Request, env: Env) {
  const payload = await parseCreateCardRequest(request)

  if (!payload) {
    return Response.json(
      { error: 'deckId, card.front, and card.back are required' },
      { status: 400 }
    )
  }

  return proxyMochiApiJson('/cards/', env.MOCHI_API_KEY, {
    method: 'POST',
    body: {
      'deck-id': payload.deckId,
      content: buildMochiCardContent(payload.card),
    },
  })
}

function handleCardListRequest(url: URL, env: Env) {
  const deckId = url.searchParams.get('deck-id')

  if (!deckId) {
    return Response.json({ error: 'deck-id is required' }, { status: 400 })
  }

  return proxyMochiApiJson('/cards/', env.MOCHI_API_KEY, {
    params: buildCardQueryParams(url, deckId),
  })
}

function handleNotFound() {
  return new Response(null, { status: 404 })
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
      return handleHealthRequest()
    }

    if (url.pathname === '/api/decks') {
      return handleDeckListRequest(url, env)
    }

    if (url.pathname === '/api/cards') {
      if (request.method === 'POST') {
        return handleCardCreateRequest(request, env)
      }

      return handleCardListRequest(url, env)
    }

    return handleNotFound()
  },
} satisfies ExportedHandler<Env>
