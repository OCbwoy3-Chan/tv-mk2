import {type PropsWithChildren} from 'react'
import {Modal, View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {
  Outlet as PortalOutlet,
  Provider as PortalProvider,
} from '#/components/Portal'

export function EphemeralLoginContainer({
  children,
  onClose,
}: PropsWithChildren<{onClose: () => void}>) {
  const t = useTheme()
  return (
    <Modal visible onRequestClose={onClose}>
      <PortalProvider>
        <View style={[a.flex_1, t.atoms.bg]}>{children}</View>
        {/* Nested dialogs must render inside the modal's stacking and focus scope. */}
        <PortalOutlet />
      </PortalProvider>
    </Modal>
  )
}
