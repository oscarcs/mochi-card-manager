type MochiApiRequestOptions = {
  params?: Record<string, string>
  method?: 'GET' | 'POST'
  body?: unknown
}

const MOCHI_API_BASE = 'https://app.mochi.cards/api'

function buildMochiApiUrl(path: string, params?: Record<string, string>) {
  const url = new URL(`${MOCHI_API_BASE}${path}`)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  return url
}

function buildMochiApiHeaders(apiKey: string, hasBody: boolean) {
  return {
    Authorization: `Basic ${btoa(apiKey + ':')}`,
    Accept: 'application/json',
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
  }
}

export async function proxyMochiApiJson(
  path: string,
  apiKey: string,
  options: MochiApiRequestOptions = {}
) {
  const response = await fetch(buildMochiApiUrl(path, options.params).toString(), {
    method: options.method ?? 'GET',
    headers: buildMochiApiHeaders(apiKey, options.body !== undefined),
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  })

  if (!response.ok) {
    return Response.json(
      { error: `Mochi API error: ${response.status}` },
      { status: response.status }
    )
  }

  const payload = await response.json()
  return Response.json(payload)
}
