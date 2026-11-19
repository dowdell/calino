import { describe, it, expect } from 'vitest'
import { orderCalendars, sortOrdersAfterMove } from '../calendarOrder'

const cal = (id: string, sortOrder?: number) => ({ id, sortOrder })
const ids = (list: { id: string }[]) => list.map((c) => c.id)

describe('orderCalendars', () => {
  it('keeps stored order when nothing has been placed by hand', () => {
    expect(ids(orderCalendars([cal('a'), cal('b'), cal('c')]))).toEqual(['a', 'b', 'c'])
  })

  it('sorts by sortOrder ascending', () => {
    expect(ids(orderCalendars([cal('a', 2), cal('b', 0), cal('c', 1)]))).toEqual(['b', 'c', 'a'])
  })

  it('puts calendars without a sortOrder after placed ones, in stored order', () => {
    expect(ids(orderCalendars([cal('new1'), cal('a', 1), cal('new2'), cal('b', 0)]))).toEqual([
      'b',
      'a',
      'new1',
      'new2',
    ])
  })

  it('is stable for equal sortOrder values and does not mutate its input', () => {
    const input = [cal('a', 0), cal('b', 0)]
    expect(ids(orderCalendars(input))).toEqual(['a', 'b'])
    expect(ids(input)).toEqual(['a', 'b'])
  })
})

describe('sortOrdersAfterMove', () => {
  const calendars = [cal('a'), cal('b'), cal('c'), cal('d')]

  it('moves an item down into the target slot', () => {
    const orders = sortOrdersAfterMove(calendars, 'a', 'c')!
    expect([...orders.entries()]).toEqual([
      ['b', 0],
      ['c', 1],
      ['a', 2],
      ['d', 3],
    ])
  })

  it('moves an item up into the target slot', () => {
    const orders = sortOrdersAfterMove(calendars, 'd', 'b')!
    expect([...orders.entries()]).toEqual([
      ['a', 0],
      ['d', 1],
      ['b', 2],
      ['c', 3],
    ])
  })

  it('starts from the displayed order, not the stored one', () => {
    const placed = [cal('a', 2), cal('b', 0), cal('c', 1)]
    const orders = sortOrdersAfterMove(placed, 'a', 'b')!
    expect([...orders.entries()]).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ])
  })

  it('returns null for a no-op or an unknown id', () => {
    expect(sortOrdersAfterMove(calendars, 'a', 'a')).toBeNull()
    expect(sortOrdersAfterMove(calendars, 'a', 'zzz')).toBeNull()
    expect(sortOrdersAfterMove(calendars, 'zzz', 'a')).toBeNull()
  })
})
