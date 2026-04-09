import { routeAgentRequest } from 'agents'

import { MochiCardAgent } from './agents/mochi-card-agent'

export { MochiCardAgent }

const AGENT_PREFIX = '/api/agents'
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

    return new Response(null, { status: 404 })
  },
} satisfies ExportedHandler<Env>
