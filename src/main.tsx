import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Register the service worker (enables the Android "Install app" prompt).
// Production only, so it never interferes with the dev server's HMR.
// BASE_URL is "/" in dev and "/meteogram/" in the GitHub Pages build.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      /* SW registration is best-effort; the app works fine without it */
    })
  })
}
