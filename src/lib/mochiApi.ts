import type { GeneratedCard } from '../types/cards'
import type { MochiCard, MochiDeck, MochiListResponse } from '../types/decks'

type QueryParams = Record<string, string | undefined>

function buildUrl(path: string, params: QueryParams = {}) {
  const url = new URL(path, window.location.origin)

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value)
    }
  }

  return `${url.pathname}${url.search}`
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

async function fetchListPage<T>(path: string, params: QueryParams = {}) {
  return fetchJson<MochiListResponse<T>>(buildUrl(path, params))
}

async function fetchAllListDocs<T>(path: string, params: QueryParams = {}) {
  const docs: T[] = []
  let bookmark: string | undefined

  do {
    const page = await fetchListPage<T>(path, {
      ...params,
      bookmark,
    })

    docs.push(...page.docs)
    bookmark = page.docs.length > 0 ? page.bookmark : undefined
  } while (bookmark)

  return docs
}

export function fetchDecks() {
  return fetchAllListDocs<MochiDeck>('/api/decks')
}

export function fetchDeckCards(deckId: string) {
  return fetchAllListDocs<MochiCard>('/api/cards', {
    'deck-id': deckId,
  })
}

export async function fetchDeckExampleCards(deckId: string, limit: number) {
  const response = await fetchListPage<MochiCard>('/api/cards', {
    'deck-id': deckId,
    limit: String(limit),
  })

  return response.docs
}

export async function createDeckCard(deckId: string, card: GeneratedCard) {
  const response = await fetch('/api/cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deckId,
      card,
    }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? `Failed to create card: ${response.status}`)
  }
}
