/** Set `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local` (Clerk Dashboard → API keys). */
export const clerkPublishableKey: string = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? ''

export function isClerkEnabled(): boolean {
  return clerkPublishableKey.length > 0
}
