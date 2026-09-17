import {parseSearchLink} from '#/lib/routes/searchLink'

/** Leaves pastes in editors and prompts to their own handlers. */
export function handlePastedLink(
  event: ClipboardEvent,
  openLink: (link: NonNullable<ReturnType<typeof parseSearchLink>>) => void,
) {
  if (
    event.defaultPrevented ||
    document.querySelector(
      '[role="dialog"], [role="alertdialog"], [aria-modal="true"], dialog[open]',
    )
  ) {
    return
  }

  const editorSelector =
    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="searchbox"], [role="combobox"]'
  if (
    document.activeElement?.closest(editorSelector) ||
    event
      .composedPath()
      .some(
        target => target instanceof Element && target.closest(editorSelector),
      )
  ) {
    return
  }

  const link = parseSearchLink(event.clipboardData?.getData('text/plain') ?? '')
  if (!link) return

  event.preventDefault()
  openLink(link)
}
