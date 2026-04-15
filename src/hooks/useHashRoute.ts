import { useSyncExternalStore } from 'react'

import {
  getHashServerSnapshot,
  getHashSnapshot,
  subscribeHash,
  type ParsedHash,
} from '@/lib/hashRoute'

function subscribe(onStoreChange: () => void) {
  return subscribeHash(onStoreChange)
}

export function useHashRoute(): ParsedHash {
  return useSyncExternalStore(
    subscribe,
    getHashSnapshot,
    getHashServerSnapshot,
  )
}
