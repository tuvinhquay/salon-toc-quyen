import { describe, expect, it } from 'vitest'
import { navigation } from '../src/app/navigation'

describe('Owner navigation map', () => {
  it('has unique paths and labels', () => {
    const paths = navigation.map((item) => item.to)
    const labels = navigation.map((item) => item.label)
    expect(new Set(paths).size).toBe(paths.length)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('includes the Owner modules defined by the roadmap', () => {
    expect(navigation.map((item) => item.to)).toEqual([
      '/', '/guide', '/appointments', '/customers', '/workflow', '/employees',
      '/services', '/inventory', '/pos', '/reports', '/devices',
      '/backup', '/assistant', '/settings',
    ])
  })

  it('uses local application paths only', () => {
    expect(navigation.every((item) => item.to.startsWith('/'))).toBe(true)
    expect(navigation.some((item) => item.to === '#')).toBe(false)
  })
})
