import { test, expect, type Page } from '@playwright/test'
import { clearState, seedStoreCalendars } from './fixtures/localstorage'

/**
 * Reordering the sidebar's calendar list: by dragging a row's grip, from the
 * keyboard, and from the context menu. The order is the user's own, so it must
 * survive a reload and must not disturb the visibility checkbox.
 */

const CALENDARS = [
  { id: 'work', name: 'Work', color: '#4285F4' },
  { id: 'home', name: 'Home', color: '#0F9D58' },
  { id: 'family', name: 'Family', color: '#E8710A' },
]

const toggle = (page: Page, calendarId: string) =>
  page.locator(`[data-component="calendar-visibility-toggle"][data-calendar-id="${calendarId}"]`)

const row = (page: Page, calendarId: string) =>
  page.locator('[data-component="calendar-item"]').filter({ has: toggle(page, calendarId) })

const handle = (page: Page, calendarId: string) =>
  row(page, calendarId).locator('[data-component="calendar-drag-handle"]')

async function expandCalendars(page: Page): Promise<void> {
  const section = page.locator('[data-component="calendar-section-toggle"]')
  if ((await section.getAttribute('aria-expanded')) !== 'true') await section.click()
  await expect(toggle(page, 'work')).toBeVisible()
}

async function listedOrder(page: Page): Promise<(string | undefined)[]> {
  return page
    .locator('[data-component="calendar-visibility-toggle"]')
    .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.calendarId))
}

test.describe('Sidebar: reorder calendars', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page)
    await seedStoreCalendars(page, CALENDARS)
    await page.goto('/week')
    await expandCalendars(page)
  })

  test('lists calendars in their stored order until reordered', async ({ page }) => {
    expect(await listedOrder(page)).toEqual(['work', 'home', 'family'])
  })

  test('dragging a row by its grip reorders the list and the order survives a reload', async ({
    page,
  }) => {
    const grip = await handle(page, 'family').boundingBox()
    const target = await row(page, 'work').boundingBox()
    expect(grip && target).toBeTruthy()

    await page.mouse.move(grip!.x + grip!.width / 2, grip!.y + grip!.height / 2)
    await page.mouse.down()
    // Move in steps: dnd-kit needs several pointer events past the activation distance.
    await page.mouse.move(grip!.x + grip!.width / 2, grip!.y - 8, { steps: 4 })
    await page.mouse.move(grip!.x + grip!.width / 2, target!.y + 2, { steps: 10 })
    await page.mouse.up()

    await expect.poll(() => listedOrder(page)).toEqual(['family', 'work', 'home'])

    await page.reload()
    await expandCalendars(page)
    expect(await listedOrder(page)).toEqual(['family', 'work', 'home'])
  })

  test('the grip works from the keyboard', async ({ page }) => {
    await handle(page, 'work').focus()
    await page.keyboard.press('Space')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Space')

    await expect.poll(() => listedOrder(page)).toEqual(['home', 'work', 'family'])
  })

  test('Move up / Move down in the context menu reorder the list', async ({ page }) => {
    // The first row has nowhere to go up to.
    await row(page, 'work').click({ button: 'right' })
    await expect(page.locator('[data-component="calendar-move-up"]')).toHaveCount(0)
    await page.locator('[data-component="calendar-move-down"]').click()
    await expect.poll(() => listedOrder(page)).toEqual(['home', 'work', 'family'])

    await row(page, 'family').click({ button: 'right' })
    await expect(page.locator('[data-component="calendar-move-down"]')).toHaveCount(0)
    await page.locator('[data-component="calendar-move-up"]').click()
    await expect.poll(() => listedOrder(page)).toEqual(['home', 'family', 'work'])
  })

  test('clicking the grip does not toggle the calendar', async ({ page }) => {
    await expect(toggle(page, 'home')).toBeChecked()
    await handle(page, 'home').click()
    await expect(toggle(page, 'home')).toBeChecked()

    // The checkbox itself still works.
    await toggle(page, 'home').uncheck()
    await expect(toggle(page, 'home')).not.toBeChecked()
  })
})
