import {type PropsWithChildren} from 'react'
import {Modal} from 'react-native'

export function EphemeralLoginContainer({
  children,
  onClose,
}: PropsWithChildren<{onClose: () => void}>) {
  return (
    <Modal visible onRequestClose={onClose}>
      {children}
    </Modal>
  )
}
