'use client'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowBanner(false)
    setDeferredPrompt(null)
  }

  if (!showBanner) return null

  return (
    <div style={{
      position:        'fixed',
      bottom:          '20px',
      left:            '50%',
      transform:       'translateX(-50%)',
      background:      '#1B2A4A',
      color:           'white',
      padding:         '16px 24px',
      borderRadius:    '12px',
      display:         'flex',
      alignItems:      'center',
      gap:             '12px',
      zIndex:          9999,
      boxShadow:       '0 4px 20px rgba(0,0,0,0.3)',
      maxWidth:        '320px',
      width:           '90%',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/favicon.png" alt="PilotResto" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Installer PilotResto</div>
        <div style={{ fontSize: '12px', color: '#B8962E' }}>Accès rapide depuis votre écran d&apos;accueil</div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background:   '#B8962E',
          color:        'white',
          border:       'none',
          padding:      '8px 16px',
          borderRadius: '8px',
          cursor:       'pointer',
          fontWeight:   'bold',
          fontSize:     '13px',
        }}
      >
        Installer
      </button>
      <button
        onClick={() => setShowBanner(false)}
        aria-label="Fermer"
        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
      >
        ✕
      </button>
    </div>
  )
}
