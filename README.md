# Mochi Card Manager

This is a project for managing and creating flashcards for the spaced repitition app Mochi.

## Install and run

```
npm i
npx wrangler types
npm run build
```

## Tech stack

Vite + React + TypeScript + Cloudflare Workers

## Backend

The backend is a Cloudflare Agent mounted at `/api/agents/mochi-card-agent/:instance`.

Useful endpoints:

- `GET /api/health` returns worker and agent routing status
- the default chat agent instance lives at `/api/agents/mochi-card-agent/default`
