import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
  .then(reg => console.log('Registered:', reg.scope))
  .catch(err => console.log('Failed:', err));
  }
