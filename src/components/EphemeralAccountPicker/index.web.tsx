import {useEffect, useRef} from 'react'
import {DropdownMenu} from 'radix-ui'

import {SwitchMenuItems} from '#/view/shell/desktop/LeftNav'
import {type AccountPickerProps} from '#/components/EphemeralAccountPicker/types'
import * as Menu from '#/components/Menu'

export {useMenuControl as useAccountPickerControl} from '#/components/Menu'

/** One dropdown for all post actions, positioned at the button that opened it. */
export function EphemeralAccountPicker({
  control,
  request,
  accounts,
  signOutPromptControl,
}: AccountPickerProps) {
  const dismissGuardRef = useRef(false)
  const target = request?.target
  const anchor =
    target instanceof Element
      ? target.closest<HTMLElement>('button, [role="button"]')
      : null
  const rect = anchor?.getBoundingClientRect()

  useEffect(() => {
    if (!control.isOpen) return
    dismissGuardRef.current = Boolean(request?.pointerHeld)
    const release = () => {
      requestAnimationFrame(() => {
        dismissGuardRef.current = false
      })
    }
    const closeOnScroll = (event: Event) => {
      // Scrolling inside the account menu must not dismiss it.
      if (
        event.target instanceof Element &&
        event.target.closest('[role="menu"]')
      )
        return
      control.close()
    }
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('blur', release)
    window.addEventListener('scroll', closeOnScroll, true)
    return () => {
      dismissGuardRef.current = false
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('blur', release)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [control, request])

  return (
    <Menu.Root control={control} dismissGuardRef={dismissGuardRef}>
      <DropdownMenu.Trigger asChild>
        <span
          aria-hidden
          tabIndex={-1}
          style={{
            position: 'fixed',
            pointerEvents: 'none',
            top: rect?.top ?? 0,
            left: rect?.left ?? 0,
            width: rect?.width ?? 0,
            height: rect?.height ?? 0,
          }}
        />
      </DropdownMenu.Trigger>
      <SwitchMenuItems
        accounts={accounts}
        signOutPromptControl={signOutPromptControl}
        showExtraButtons={false}
        showAddAccount={false}
        title={request?.title}
        onSelectAccount={request?.onSelectAccount}
        onCloseAutoFocus={event => {
          event.preventDefault()
          if (anchor?.isConnected) anchor.focus({preventScroll: true})
        }}
      />
    </Menu.Root>
  )
}
