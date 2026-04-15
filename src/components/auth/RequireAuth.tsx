import { SignInButton, useAuth } from '@clerk/clerk-react'
import type { ReactNode } from 'react'

import { isClerkEnabled } from '@/lib/clerkConfig'
import { setHash } from '@/lib/hashRoute'

type Props = {
  children: ReactNode
}

/**
 * When Clerk is configured, only signed-in users see `children`.
 * Otherwise the app stays open (hackathon / no-auth mode).
 */
export function RequireAuth({ children }: Props) {
  if (!isClerkEnabled()) return <>{children}</>

  return <RequireAuthClerk>{children}</RequireAuthClerk>
}

function RequireAuthClerk({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black font-sans text-[14px] text-white/55">
        Loading session…
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-black px-6 font-sans text-white">
        <div className="max-w-md text-center">
          <p className="text-lg font-semibold tracking-tight">Sign in required</p>
          <p className="mt-2 text-[15px] leading-relaxed text-white/60">
            Use your account to access commute, SOS relay, Jaam, and ops tools.
          </p>
        </div>
        <SignInButton mode="modal">
          <button
            type="button"
            className="rounded-full border border-white/25 bg-[#EE3F2C] px-8 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white shadow-lg shadow-red-950/30 transition hover:bg-[#EE3F2C]/90"
          >
            Sign in
          </button>
        </SignInButton>
        <button
          type="button"
          className="text-[13px] text-white/45 underline-offset-4 transition hover:text-white/75 hover:underline"
          onClick={() => setHash({ page: 'home', tab: 'features' })}
        >
          Back to home
        </button>
      </div>
    )
  }

  return <>{children}</>
}
