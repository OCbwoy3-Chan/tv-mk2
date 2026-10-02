const OVERLAY_SELECTOR = '[role="menu"], [role="dialog"], [aria-modal="true"]'
const INPUT_SELECTOR =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="searchbox"], [role="slider"], [role="spinbutton"]'
const MENU_ITEM_SELECTOR =
  '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'
const DIALOG_CONTROL_SELECTOR =
  'button, a[href], [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [tabindex]'

/** Moves focus within the active overlay without activating its controls. */
export function handleOverlayNavigation(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    (event.key !== 'j' && event.key !== 'k')
  ) {
    return false
  }

  const target = event.target
  if (!(target instanceof Element) || target.closest(INPUT_SELECTOR)) {
    return false
  }
  const overlay = target.closest<HTMLElement>(OVERLAY_SELECTOR)
  if (!overlay) return false

  const isMenu = overlay.getAttribute('role') === 'menu'
  const items = Array.from(
    overlay.querySelectorAll<HTMLElement>(
      isMenu ? MENU_ITEM_SELECTOR : DIALOG_CONTROL_SELECTOR,
    ),
  ).filter(item => {
    if (
      item.closest(OVERLAY_SELECTOR) !== overlay ||
      item.closest('[hidden], [inert], [aria-hidden="true"]') ||
      item.matches(':disabled') ||
      item.getAttribute('aria-disabled') === 'true' ||
      item.closest(INPUT_SELECTOR) ||
      (!isMenu && item.tabIndex < 0)
    ) {
      return false
    }
    const style = window.getComputedStyle(item)
    const rect = item.getBoundingClientRect()
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      rect.width > 0 &&
      rect.height > 0
    )
  })
  if (!items.length) return false

  const currentIndex = items.findIndex(item => item === document.activeElement)
  const direction = event.key === 'j' ? 1 : -1
  const nextIndex =
    currentIndex < 0
      ? direction === 1
        ? 0
        : items.length - 1
      : (currentIndex + direction + items.length) % items.length

  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  items[nextIndex].focus()
  return true
}
