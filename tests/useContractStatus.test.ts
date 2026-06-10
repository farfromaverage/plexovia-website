import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContractStatus } from '@/hooks/useContractStatus'

function makeEntries(n: number, bookmarked: Set<number> = new Set()) {
  const entries: Record<string, any> = {}
  for (let i = 0; i < n; i++) {
    entries[`c${i}`] = {
      bookmarked: bookmarked.has(i),
      dismissed: false,
      viewed: false,
    }
  }
  return entries
}

describe('useContractStatus', () => {
  let userIdCounter = 0

  beforeEach(() => {
    localStorage.clear()
    userIdCounter = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function freshUser() {
    return `testuser${++userIdCounter}`
  }

  it('init creates scoped storage key', () => {
    const { result } = renderHook(() => useContractStatus())
    const uid = freshUser()
    act(() => { result.current.init(uid) })
    act(() => { result.current.toggleBookmark('c1') })

    const raw = localStorage.getItem(`plexovia-contract-status-${uid}`)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed['c1']?.bookmarked).toBe(true)
  })

  it('toggleBookmark toggles correctly', () => {
    const { result } = renderHook(() => useContractStatus())
    act(() => { result.current.init(freshUser()) })

    act(() => { result.current.toggleBookmark('c1') })
    expect(result.current.isBookmarked('c1')).toBe(true)

    act(() => { result.current.toggleBookmark('c1') })
    expect(result.current.isBookmarked('c1')).toBe(false)
  })

  it('isBookmarked returns correct value', () => {
    const { result } = renderHook(() => useContractStatus())
    act(() => { result.current.init(freshUser()) })

    expect(result.current.isBookmarked('c1')).toBe(false)

    act(() => { result.current.toggleBookmark('c1') })
    expect(result.current.isBookmarked('c1')).toBe(true)
  })

  it('dismiss sets dismissed state with timestamp', () => {
    const { result } = renderHook(() => useContractStatus())
    const uid = freshUser()
    act(() => { result.current.init(uid) })
    act(() => { result.current.dismiss('c1') })

    expect(result.current.isDismissed('c1')).toBe(true)

    const raw = localStorage.getItem(`plexovia-contract-status-${uid}`)
    const parsed = JSON.parse(raw!)
    expect(parsed['c1']?.dismissed).toBe(true)
    expect(typeof parsed['c1']?.dismissedAt).toBe('number')
  })

  it('undoDismiss clears dismissed', () => {
    const { result } = renderHook(() => useContractStatus())
    act(() => { result.current.init(freshUser()) })

    act(() => { result.current.dismiss('c1') })
    expect(result.current.isDismissed('c1')).toBe(true)

    act(() => { result.current.undoDismiss('c1') })
    expect(result.current.isDismissed('c1')).toBe(false)
  })

  it('isDismissed returns correct value', () => {
    const { result } = renderHook(() => useContractStatus())
    act(() => { result.current.init(freshUser()) })

    expect(result.current.isDismissed('c1')).toBe(false)
    act(() => { result.current.dismiss('c1') })
    expect(result.current.isDismissed('c1')).toBe(true)
  })

  it('markViewed marks as viewed and is idempotent', () => {
    const { result } = renderHook(() => useContractStatus())
    act(() => { result.current.init(freshUser()) })

    expect(result.current.isViewed('c1')).toBe(false)
    act(() => { result.current.markViewed('c1') })
    expect(result.current.isViewed('c1')).toBe(true)

    act(() => { result.current.markViewed('c1') })
    expect(result.current.isViewed('c1')).toBe(true)
  })

  it('isolates different users', () => {
    const { result } = renderHook(() => useContractStatus())

    act(() => { result.current.init('isoUserA') })
    act(() => { result.current.toggleBookmark('c1') })
    expect(result.current.isBookmarked('c1')).toBe(true)

    act(() => { result.current.init('isoUserB') })
    expect(result.current.isBookmarked('c1')).toBe(false)
  })

  it('evicts oldest non-bookmarked entries when over threshold', () => {
    const uid = freshUser()
    const key = `plexovia-contract-status-${uid}`
    localStorage.setItem(key, JSON.stringify(makeEntries(510, new Set([0]))))

    const { result } = renderHook(() => useContractStatus())
    act(() => { result.current.init(uid) })
    act(() => { result.current.toggleBookmark('new') })

    const saved = JSON.parse(localStorage.getItem(key)!)
    expect(Object.keys(saved).length).toBeLessThanOrEqual(500)
    expect(saved['c0']?.bookmarked).toBe(true)
    expect(saved['new']?.bookmarked).toBe(true)
  })

  it('logs warning on localStorage quota failure', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })

    const { result } = renderHook(() => useContractStatus())
    act(() => { result.current.init(freshUser()) })
    act(() => { result.current.toggleBookmark('c1') })

    expect(warnSpy).toHaveBeenCalled()
  })
})
