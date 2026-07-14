import type { Metadata } from 'next'
import { InviteClient } from '@/components/invite/InviteClient'

export const metadata: Metadata = { title: 'Rejoindre PilotResto' }

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <InviteClient token={token} />
}
