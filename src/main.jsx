import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '16px',
              fontWeight: 600,
            },
            className: 'dark:!bg-[#1e293b] dark:!text-slate-100',
          }}
        />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
