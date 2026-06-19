import { redirect } from 'next/navigation'

export default function ImportPage() {
  // L'import CSV est géré dans la page Intégrations
  redirect('/dashboard/parametres/integrations')
}
