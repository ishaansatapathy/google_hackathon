import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

import { isClerkEnabled } from '@/lib/clerkConfig'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  /** Smaller controls for dense mobile headers */
  compact?: boolean
}

/**
 * Sign in (modal) + account menu when Clerk is configured; renders nothing otherwise.
 */
export function AuthHeaderChrome({ className, compact }: Props) {
  if (!isClerkEnabled()) return null

  const btn =
    'rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EE3F2C]'
  const btnCompact = 'px-2.5 py-1 text-[11px]'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className={cn(btn, compact && btnCompact)}>
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: compact ? 'size-7 sm:size-8' : 'size-8',
              userButtonPopoverCard: 'border border-white/10 shadow-xl',
            },
          }}
        />
      </SignedIn>
    </div>
  )
}
