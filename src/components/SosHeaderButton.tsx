import { SignInButton, useAuth } from '@clerk/clerk-react'
import { Siren } from 'lucide-react'

import { useSos } from '@/context/SosContext'
import { isClerkEnabled } from '@/lib/clerkConfig'
import { cn } from '@/lib/utils'

const btnClass =
  'inline-flex shrink-0 items-center gap-2 rounded-full border border-red-500/90 bg-red-600 px-3 py-1.5 text-[13px] font-bold uppercase tracking-wider text-white shadow-md shadow-red-950/40 transition hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 sm:px-4 sm:py-2 disabled:cursor-not-allowed disabled:opacity-45'

type Props = {
  className?: string
}

function SosHeaderButtonOpen({ className }: Props) {
  const { openMeshModal } = useSos()
  return (
    <button
      type="button"
      className={cn(btnClass, className)}
      aria-label="SOS — mesh emergency relay (demo)"
      onClick={openMeshModal}
    >
      <Siren className="size-4 shrink-0" aria-hidden />
      SOS
    </button>
  )
}

function SosHeaderButtonClerk({ className }: Props) {
  const { openMeshModal } = useSos()
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <button type="button" className={cn(btnClass, className)} disabled aria-busy>
        <Siren className="size-4 shrink-0" aria-hidden />
        SOS
      </button>
    )
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button type="button" className={cn(btnClass, className)} aria-label="Sign in to use SOS">
          <Siren className="size-4 shrink-0" aria-hidden />
          SOS
        </button>
      </SignInButton>
    )
  }

  return (
    <button
      type="button"
      className={cn(btnClass, className)}
      aria-label="SOS — mesh emergency relay (demo)"
      onClick={openMeshModal}
    >
      <Siren className="size-4 shrink-0" aria-hidden />
      SOS
    </button>
  )
}

export function SosHeaderButton({ className }: Props) {
  if (!isClerkEnabled()) {
    return <SosHeaderButtonOpen className={className} />
  }
  return <SosHeaderButtonClerk className={className} />
}
