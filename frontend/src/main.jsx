import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter keeps the app shell mounted while the page content swaps by route. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
