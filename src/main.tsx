import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './auth/AuthProvider'
import { AuthGate } from './auth/AuthGate'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <>
      <video className="global-background-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1}>
        <source src="/videos/videosalo.mp4" type="video/mp4"/>
      </video>
      <div className="global-background-overlay" aria-hidden="true"/>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </>
  </React.StrictMode>,
)
