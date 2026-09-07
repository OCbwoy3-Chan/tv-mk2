import {type PropsWithChildren} from 'react'
import {Modal} from 'react-native'
import {KeyboardProvider} from 'react-native-keyboard-controller'
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context'

import {atoms as a, useTheme} from '#/alf'
import {BottomSheetPortalProvider} from '../../modules/bottom-sheet/src/BottomSheetPortal'

export function EphemeralLoginContainer({
  children,
  onClose,
}: PropsWithChildren<{onClose: () => void}>) {
  const t = useTheme()
  return (
    <Modal visible onRequestClose={onClose} presentationStyle="fullScreen">
      <SafeAreaProvider>
        <KeyboardProvider preload={false}>
          <SafeAreaView style={[a.flex_1, t.atoms.bg]}>
            {/* Login's hosting-provider dialogs belong to this native window. */}
            <BottomSheetPortalProvider>{children}</BottomSheetPortalProvider>
          </SafeAreaView>
        </KeyboardProvider>
      </SafeAreaProvider>
    </Modal>
  )
}
