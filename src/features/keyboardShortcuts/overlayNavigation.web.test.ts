/** @jest-environment jsdom */

import {handleOverlayNavigation} from '#/features/keyboardShortcuts/overlayNavigation.web'

function createOverlay(role: 'menu' | 'dialog') {
  const overlay = document.createElement('div')
  overlay.setAttribute('role', role)
  overlay.tabIndex = -1
  document.body.appendChild(overlay)
  return overlay
}

function addControl(overlay: HTMLElement, role?: string) {
  const control = document.createElement('button')
  if (role) {
    control.setAttribute('role', role)
    control.tabIndex = -1
  }
  control.getBoundingClientRect = () => ({width: 100, height: 30}) as DOMRect
  overlay.appendChild(control)
  return control
}

function press(key: string, options: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  })
  document.activeElement!.dispatchEvent(event)
  return event
}

beforeEach(() => {
  document.body.replaceChildren()
  window.addEventListener('keydown', handleOverlayNavigation, true)
})

afterEach(() => {
  window.removeEventListener('keydown', handleOverlayNavigation, true)
})

it.each(['menu', 'dialog'] as const)(
  'moves and wraps focus in a %s without activating an option',
  role => {
    const overlay = createOverlay(role)
    const first = addControl(overlay, role === 'menu' ? 'menuitem' : undefined)
    const second = addControl(overlay, role === 'menu' ? 'menuitem' : undefined)
    const activate = jest.fn()
    second.addEventListener('click', activate)
    first.focus()

    expect(press('j').defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(second)
    press('j', {repeat: true})
    expect(document.activeElement).toBe(first)
    press('k')
    expect(document.activeElement).toBe(second)
    expect(activate).not.toHaveBeenCalled()
  },
)

it('chooses the first or last option when the menu container has focus', () => {
  const menu = createOverlay('menu')
  const first = addControl(menu, 'menuitemcheckbox')
  const last = addControl(menu, 'menuitemradio')
  menu.focus()
  press('j')
  expect(document.activeElement).toBe(first)
  menu.focus()
  press('k')
  expect(document.activeElement).toBe(last)
})

it('keeps submenu navigation separate from the parent menu', () => {
  const parent = createOverlay('menu')
  const trigger = addControl(parent, 'menuitem')
  const submenu = createOverlay('menu')
  parent.appendChild(submenu)
  const first = addControl(submenu, 'menuitem')
  const last = addControl(submenu, 'menuitem')
  first.focus()
  press('k')
  expect(document.activeElement).toBe(last)
  trigger.focus()
  press('j')
  expect(document.activeElement).toBe(trigger)
})

it('navigates a nested discard prompt independently of the composer', () => {
  const composer = createOverlay('dialog')
  addControl(composer)
  const prompt = createOverlay('dialog')
  composer.appendChild(prompt)
  const keepEditing = addControl(prompt)
  const discard = addControl(prompt)
  keepEditing.focus()
  press('j')
  expect(document.activeElement).toBe(discard)
  press('j')
  expect(document.activeElement).toBe(keepEditing)
})

it('skips unavailable dialog controls', () => {
  const dialog = createOverlay('dialog')
  const first = addControl(dialog)
  addControl(dialog).disabled = true
  addControl(dialog).setAttribute('aria-disabled', 'true')
  addControl(dialog).hidden = true
  addControl(dialog).style.display = 'none'
  addControl(dialog).style.visibility = 'hidden'
  addControl(dialog).tabIndex = -1
  const hidden = document.createElement('div')
  hidden.setAttribute('aria-hidden', 'true')
  dialog.appendChild(hidden)
  addControl(hidden)
  const last = addControl(dialog)
  first.focus()
  press('j')
  expect(document.activeElement).toBe(last)
})

it.each(['input', 'textarea', 'select', 'contenteditable', 'slider'])(
  'leaves j/k alone in a %s',
  kind => {
    const dialog = createOverlay('dialog')
    const field = document.createElement(
      ['contenteditable', 'slider'].includes(kind) ? 'div' : kind,
    )
    field.tabIndex = 0
    if (kind === 'contenteditable')
      field.setAttribute('contenteditable', 'true')
    if (kind === 'slider') field.setAttribute('role', 'slider')
    dialog.appendChild(field)
    addControl(dialog)
    field.focus()
    expect(press('j').defaultPrevented).toBe(false)
    expect(press('k').defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(field)
  },
)

it.each([
  {ctrlKey: true},
  {altKey: true},
  {metaKey: true},
  {shiftKey: true},
  {isComposing: true},
])('preserves modified keys and IME input: %o', options => {
  const menu = createOverlay('menu')
  const first = addControl(menu, 'menuitem')
  addControl(menu, 'menuitem')
  first.focus()
  expect(press('j', options).defaultPrevented).toBe(false)
  expect(document.activeElement).toBe(first)
})

it('prevents menu typeahead and other handlers from processing j/k', () => {
  const menu = createOverlay('menu')
  const first = addControl(menu, 'menuitem')
  addControl(menu, 'menuitem')
  const typeahead = jest.fn()
  menu.addEventListener('keydown', typeahead)
  first.focus()
  press('j')
  expect(typeahead).not.toHaveBeenCalled()
  expect(press('Enter').defaultPrevented).toBe(false)
  expect(press('Escape').defaultPrevented).toBe(false)
  expect(typeahead).toHaveBeenCalledTimes(2)
})

it('leaves page navigation and empty overlays alone', () => {
  const pageButton = addControl(document.body)
  pageButton.focus()
  expect(press('j').defaultPrevented).toBe(false)
  const emptyMenu = createOverlay('menu')
  emptyMenu.focus()
  expect(press('j').defaultPrevented).toBe(false)
})
