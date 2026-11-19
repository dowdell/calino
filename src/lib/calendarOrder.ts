import type { Calendar } from '@/types'

type Orderable = Pick<Calendar, 'id' | 'sortOrder'>

/**
 * The order the sidebar lists calendars in. Calendars the user has placed by
 * hand (`sortOrder`) come first, ascending; everything else keeps its stored
 * order after them, so a calendar added later lands at the end and calendars
 * of a user who never reordered anything are listed exactly as before.
 *
 * The server's per-account `calendar-order` hint is deliberately not used:
 * values from different accounts aren't comparable and would interleave them.
 */
export function orderCalendars<T extends Orderable>(calendars: readonly T[]): T[] {
  return calendars
    .map((calendar, index) => ({ calendar, index }))
    .sort((a, b) => {
      const aOrder = a.calendar.sortOrder
      const bOrder = b.calendar.sortOrder
      if (aOrder !== undefined && bOrder !== undefined && aOrder !== bOrder) return aOrder - bOrder
      if (aOrder !== undefined && bOrder === undefined) return -1
      if (aOrder === undefined && bOrder !== undefined) return 1
      return a.index - b.index
    })
    .map(({ calendar }) => calendar)
}

/**
 * The `sortOrder` every calendar should carry after moving `activeId` into the
 * slot `overId` occupies (the dnd-kit sortable convention: the dragged item
 * takes the target's index and the items between shift by one). Returns null
 * when nothing would change.
 */
export function sortOrdersAfterMove(
  calendars: readonly Orderable[],
  activeId: string,
  overId: string
): Map<string, number> | null {
  if (activeId === overId) return null
  const ids = orderCalendars(calendars).map((calendar) => calendar.id)
  const from = ids.indexOf(activeId)
  const to = ids.indexOf(overId)
  if (from === -1 || to === -1) return null
  ids.splice(to, 0, ...ids.splice(from, 1))
  return new Map(ids.map((id, index) => [id, index]))
}
