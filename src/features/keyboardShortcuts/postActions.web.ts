import {useEffect, useRef} from 'react'

export const POST_KEYBOARD_ACTION_EVENT = 'witchsky:post-keyboard-action'

/** Routes shortcuts directly to the post callbacks without opening a menu. */
export function usePostKeyboardActions({
  onRepost,
  onQuote,
  embeddingDisabled,
  enabled,
}: {
  onRepost: () => void
  onQuote: (openAccountSwitcher?: boolean) => void
  embeddingDisabled: boolean
  enabled: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled) return

    const onAction = (event: Event) => {
      const {action, openAccountSwitcher} = (
        event as CustomEvent<{
          action: 'repost' | 'quote'
          openAccountSwitcher: boolean
        }>
      ).detail
      event.stopPropagation()
      event.preventDefault()
      if (action === 'repost') onRepost()
      if (action === 'quote' && !embeddingDisabled) onQuote(openAccountSwitcher)
    }

    element.addEventListener(POST_KEYBOARD_ACTION_EVENT, onAction)
    return () =>
      element.removeEventListener(POST_KEYBOARD_ACTION_EVENT, onAction)
  }, [enabled, embeddingDisabled, onQuote, onRepost])

  return ref
}
