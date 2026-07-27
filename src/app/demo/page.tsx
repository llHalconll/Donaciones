import { notFound, redirect } from 'next/navigation'
import { getDemoUsername } from '@/lib/public-config'

export default function DemoPage() {
  const demoUsername = getDemoUsername()
  if (!demoUsername) notFound()

  redirect(`/${demoUsername}`)
}
