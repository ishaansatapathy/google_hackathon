import { describe, expect, it } from 'vitest'

import { GOOGLE_STACK } from '@/lib/googleStack'

describe('GOOGLE_STACK registry', () => {
  it('lists Maps JavaScript API and Cloud Run family', () => {
    expect(GOOGLE_STACK.mapsPlatform.apis).toContain('Maps JavaScript API')
    expect(GOOGLE_STACK.cloud.products).toContain('Cloud Run')
    expect(GOOGLE_STACK.cloud.products).toContain('Cloud Build')
    expect(GOOGLE_STACK.cloud.products).toContain('Artifact Registry')
  })

  it('points to real entry files', () => {
    expect(GOOGLE_STACK.mapsPlatform.entrypoints.join('')).toContain('googleMapsLoader')
  })
})
