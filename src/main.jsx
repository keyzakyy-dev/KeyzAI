import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Pasang .hydrated satu frame setelah first paint: selama itu [data-reveal]
// dipaksa visible (lihat index.css) supaya tidak ada masa blank saat JS lambat
// di mobile. Kelas dipasang di DOM pertama sebelum render React.
if (!document.documentElement.classList.contains('hydrated')) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.documentElement.classList.add('hydrated')
  }))
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
