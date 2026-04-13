# Mochi Card Manager

Mochi Card Manager is a small React + Cloudflare Workers app for browsing Mochi decks and generating new language-learning cards with an AI agent.

The UI lets you:

- browse decks and cards from a connected Mochi account
- generate candidate cards for a selected deck
- ground generation in existing deck examples and optional pasted URLs
- review, deselect, and approve generated cards before sending them to Mochi

## Stack

- Vite
- React
- TypeScript
- Cloudflare Workers
- Cloudflare Agents / Workers AI

## Requirements

- Node.js
- npm
- a Mochi API key exposed to the worker as `MOCHI_API_KEY`

Create a local `.dev.vars` file with:

```env
MOCHI_API_KEY=your_mochi_api_key
```

## Development

Install dependencies:

```bash
npm install
```

Generate Wrangler types when needed:

```bash
npx wrangler types
```

Start local development:

```bash
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build
```

Deploy:

```bash
npm run deploy
```

## Architecture

### Frontend

- [src/App.tsx](./src/App.tsx): top-level app orchestration and view switching
- [src/components](./src/components): UI components and screen-level views
- [src/hooks](./src/hooks): data-loading hooks for deck cards and example cards
- [src/lib/mochiApi.ts](./src/lib/mochiApi.ts): browser-side API client and pagination helpers
- [src/lib/proposedCards.ts](./src/lib/proposedCards.ts): proposal-state transitions for generated cards
- [src/lib/cardGeneration.ts](./src/lib/cardGeneration.ts): prompt assembly, response parsing, and duplicate filtering

### Backend

- [worker/index.ts](./worker/index.ts): worker entrypoint and API route handling
- [worker/lib/mochiApi.ts](./worker/lib/mochiApi.ts): Mochi API proxy helpers
- [worker/agents/mochi-card-agent.ts](./worker/agents/mochi-card-agent.ts): chat agent that generates card JSON and can fetch pasted URLs for extra context

## API Surface

The worker serves both the React app and the backend API.

Useful endpoints:

- `GET /api/health`: basic worker and agent routing status
- `GET /api/decks`: list Mochi decks, with optional `bookmark`
- `GET /api/cards?deck-id=<id>`: list cards for a deck, with optional `bookmark` and `limit`
- `POST /api/cards`: create a card in Mochi
- `POST /api/agents/mochi-card-agent/default`: default chat agent instance used by the UI

## Generation Flow

1. The app loads decks from `/api/decks`.
2. The selected generation deck loads example cards from `/api/cards`.
3. The frontend builds a generation prompt using:
   - the selected language
   - the target deck name
   - sampled cards from the selected deck
   - the user’s supplementary prompt
4. If the prompt includes URLs, the agent fetches a small excerpt from them and includes that context in generation.
5. The agent returns JSON in a fenced `json` code block.
6. The frontend parses the response, filters duplicates against existing deck cards, and lets the user approve cards individually or in bulk.

## Notes

- Existing cards are fetched before generation so duplicate fronts or front/back pairs can be filtered out before review.
- Approved cards are sent to Mochi one at a time through `POST /api/cards`.
- The worker is configured in [wrangler.jsonc](./wrangler.jsonc) and uses the `MochiCardAgent` durable object binding plus a Workers AI binding named `AI`.
