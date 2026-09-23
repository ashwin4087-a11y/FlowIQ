import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx'

const rootEl = document.getElementById('root')
const useLegacy = import.meta.env.VITE_LEGACY_APP === 'true'

function renderLoadError(message: string) {
  if (!rootEl) return
  rootEl.innerHTML = `
    <div style="min-height:100vh;background:#0B1220;color:#fff;padding:24px;font-family:system-ui,sans-serif">
      <h1 style="font-size:18px;margin-bottom:8px">FlowIQ failed to load</h1>
      <p style="color:#94A3B8;font-size:14px;margin-bottom:12px">Check the browser console for details.</p>
      <pre style="font-size:12px;background:#1E293B;border:1px solid #334155;border-radius:8px;padding:12px;overflow:auto">${message}</pre>
    </div>
  `
}

async function bootstrap() {
  if (!rootEl) {
    console.error('FlowIQ: missing #root element')
    return
  }

  const root = createRoot(rootEl)

  try {
    if (useLegacy) {
      const { default: App } = await import('./app/App.tsx')
      root.render(
        <StrictMode>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </StrictMode>,
      )
      return
    }

    const { default: FlowIQApp } = await import('./app/FlowIQApp.tsx')
    root.render(
      <StrictMode>
        <AppErrorBoundary>
          <FlowIQApp />
        </AppErrorBoundary>
      </StrictMode>,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('FlowIQ bootstrap failed:', err)
    renderLoadError(message)
  }
}

bootstrap()
