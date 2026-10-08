import { renderToString } from 'react-dom/server'
import App from './App.tsx'

// Build-time only: scripts/prerender.mjs renders the page to static HTML so
// search engines and link-preview bots (which don't run JS) see real content.
export function render(): string {
  return renderToString(<App />)
}
