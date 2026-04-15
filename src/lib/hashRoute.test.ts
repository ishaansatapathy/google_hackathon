import { beforeEach, describe, expect, it } from 'vitest'

import { parseHash } from '@/lib/hashRoute'

describe('parseHash', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('defaults empty hash to home features', () => {
    expect(parseHash()).toEqual({ page: 'home', tab: 'features' })
  })

  it('parses /emergency and /police as emergency page', () => {
    window.location.hash = '#/emergency'
    expect(parseHash()).toEqual({ page: 'emergency' })
    window.location.hash = '#/police'
    expect(parseHash()).toEqual({ page: 'emergency' })
  })

  it('parses jaam', () => {
    window.location.hash = '#/jaam'
    expect(parseHash()).toEqual({ page: 'jaam' })
  })

  it('parses commute hub vs neighbourhood', () => {
    window.location.hash = '#/commute'
    expect(parseHash()).toEqual({ page: 'commute', commute: 'hub' })
    window.location.hash = '#/commute/neighbourhood'
    expect(parseHash()).toEqual({ page: 'commute', commute: 'neighbourhood' })
  })

  it('parses /map as commute hub', () => {
    window.location.hash = '#/map'
    expect(parseHash()).toEqual({ page: 'commute', commute: 'hub' })
  })

  it('parses home tabs', () => {
    window.location.hash = '#/home/about'
    expect(parseHash()).toEqual({ page: 'home', tab: 'about' })
    window.location.hash = '#/home/contact'
    expect(parseHash()).toEqual({ page: 'home', tab: 'contact' })
    window.location.hash = '#/home/unknown'
    expect(parseHash()).toEqual({ page: 'home', tab: 'features' })
  })
})
