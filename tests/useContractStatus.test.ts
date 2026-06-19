import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContractStatus } from '@/hooks/useContractStatus'

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

  it('isolates different users for dismiss/viewed', () => {
    const { result } = renderHook(() => useContractStatus())

    act(() => { result.current.init('isoUserA') })
    act(() => { result.current.dismiss('c1') })
    expect(result.current.isDismissed('c1')).toBe(true)

    act(() => { result.current.init('isoUserB') })
    expect(result.current.isDismissed('c1')).toBe(false)
  })

  it('totalDismissedCount returns count of dismissed entries', () => {
    const { result } = renderHook(() => useContractStatus())
    act(() => { result.current.init(freshUser()) })
    act(() => { result.current.dismiss('c1') })
    act(() => { result.current.dismiss('c2') })

    expect(result.current.totalDismissedCount()).toBe(2)
  })
})
