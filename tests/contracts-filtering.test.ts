import { describe, it, expect } from 'vitest'

interface ContractStatusReader {
  isDismissed: (id: string) => boolean
  isViewed: (id: string) => boolean
}

function filterContracts(
  contracts: Array<{ id: string }>,
  statusFilter: string,
  cs: ContractStatusReader,
) {
  // "bookmarked" is server-side — not tested here
  return contracts.filter(c => {
    if (statusFilter === 'dismissed') return cs.isDismissed(c.id)
    if (statusFilter === 'new') return !cs.isViewed(c.id) && !cs.isDismissed(c.id)
    return !cs.isDismissed(c.id)
  })
}

function makeCs(overrides: Partial<ContractStatusReader> = {}): ContractStatusReader {
  return {
    isDismissed: () => false,
    isViewed: () => false,
    ...overrides,
  }
}

const contracts = [
  { id: 'c1' },
  { id: 'c2' },
  { id: 'c3' },
  { id: 'c4' },
  { id: 'c5' },
]

describe('filterContracts', () => {
  it('statusFilter "all" excludes dismissed contracts', () => {
    const cs = makeCs({ isDismissed: (id) => id === 'c1' || id === 'c3' })
    const result = filterContracts(contracts, 'all', cs)
    expect(result).toHaveLength(3)
    expect(result.map(r => r.id)).toEqual(['c2', 'c4', 'c5'])
  })

  it('statusFilter "new" excludes dismissed and shows only not-viewed', () => {
    const cs = makeCs({
      isDismissed: (id) => id === 'c1',
      isViewed: (id) => id === 'c2' || id === 'c3',
    })
    const result = filterContracts(contracts, 'new', cs)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.id)).toEqual(['c4', 'c5'])
  })

  it('statusFilter "dismissed" shows only dismissed', () => {
    const cs = makeCs({ isDismissed: (id) => id === 'c1' || id === 'c3' || id === 'c5' })
    const result = filterContracts(contracts, 'dismissed', cs)
    expect(result).toHaveLength(3)
    expect(result.map(r => r.id)).toEqual(['c1', 'c3', 'c5'])
  })

  it('handles empty contracts array', () => {
    const cs = makeCs()
    expect(filterContracts([], 'all', cs)).toEqual([])
    expect(filterContracts([], 'new', cs)).toEqual([])
    expect(filterContracts([], 'dismissed', cs)).toEqual([])
  })

  it('returns empty when all contracts are dismissed and filter is "all"', () => {
    const cs = makeCs({ isDismissed: () => true })
    expect(filterContracts(contracts, 'all', cs)).toEqual([])
  })
})
