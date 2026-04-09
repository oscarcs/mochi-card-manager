import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('unknown')

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Vite + React + Cloudflare Workers</p>
        <h1>Mochi Card Manager</h1>
        <p className="lede">
          This app now runs with the Cloudflare Vite plugin, SPA asset routing,
          and a Worker-backed API endpoint served from <code>/api/</code>.
        </p>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>Client state</h2>
          <button
            className="action-button"
            onClick={() => setCount((currentCount) => currentCount + 1)}
            aria-label="increment"
          >
            Count is {count}
          </button>
          <p>Increment this to confirm state stays live while you iterate.</p>
        </article>

        <article className="panel">
          <h2>Worker API</h2>
          <button
            className="action-button"
            onClick={() => {
              fetch('/api/')
                .then((res) => res.json() as Promise<{ name: string }>)
                .then((data) => setName(data.name))
            }}
            aria-label="get name"
          >
            Name from API is: {name}
          </button>
          <p>
            The response comes from <code>worker/index.ts</code> via the
            Cloudflare Worker runtime.
          </p>
        </article>
      </section>
    </main>
  )
}

export default App
