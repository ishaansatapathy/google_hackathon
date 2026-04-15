import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useHashRoute } from '@/hooks/useHashRoute'

describe('useHashRoute', () => {
  it('reflects current hash route', () => {
    window.location.hash = '#/jaam'
    const { result } = renderHook(() => useHashRoute())
    expect(result.current).toEqual({ page: 'jaam' })
  })

  it('updates on hashchange', () => {
    window.location.hash = '#/commute'
    const { result } = renderHook(() => useHashRoute())
    expect(result.current).toEqual({ page: 'commute', commute: 'hub' })

    act(() => {
      window.location.hash = '#/emergency'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(result.current).toEqual({ page: 'emergency' })
  })
})
