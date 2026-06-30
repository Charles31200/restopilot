'use client'

import { useEffect, useState } from 'react'

/**
 * Décale le contenu sous le header — 52px normalement, +28px en
 * plus dans l'app Electron (zone des boutons macOS natifs en haut
 * de la fenêtre, voir TopBar.tsx pour la zone "drag" correspondante).
 */
export function DashboardContentWrapper({ children }: { children: React.ReactNode }) {
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    setIsElectron(navigator.userAgent.includes('Electron'))
  }, [])

  return (
    <div
      className="md:pl-[72px] pb-[64px] md:pb-0"
      style={{ paddingTop: isElectron ? '80px' : '52px' }}
    >
      {children}
    </div>
  )
}
