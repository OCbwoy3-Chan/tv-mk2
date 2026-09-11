import {type PropsWithChildren} from 'react'
import {Modal} from 'react-native'

import {
  Outlet as PortalOutlet,
  Provider as PortalProvider,
} from '#/components/Portal'

export function EphemeralLoginContainer({
  children,
  onClose,
}: PropsWithChildren<{onClose: () => void}>) {
  return (
    <Modal visible onRequestClose={onClose}>
      <PortalProvider>
        {children}
        {/* Nested dialogs must render inside the modal's stacking and focus scope. */}
        <PortalOutlet />
      </PortalProvider>
    </Modal>
  )
}
