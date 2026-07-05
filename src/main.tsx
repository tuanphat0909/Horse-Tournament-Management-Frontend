import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Áp dụng theme đã lưu TRƯỚC khi render để tránh nháy màn hình
document.documentElement.dataset.theme = localStorage.getItem('theme') ?? 'dark'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
