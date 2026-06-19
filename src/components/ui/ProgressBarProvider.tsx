'use client'

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'

export function ProgressBarProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProgressBar
        height="3px"
        color="#D4952A"
        options={{ showSpinner: false, trickleSpeed: 200 }}
        shallowRouting
      />
    </>
  )
}
