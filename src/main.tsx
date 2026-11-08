import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
        },
        success: {
          iconTheme: { primary: '#22C55E', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#EF4444', secondary: '#fff' },
        },
      }}
    />
  </StrictMode>,
)
