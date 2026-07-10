import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useBreakpoints} from '#/alf'
import * as Layout from '#/components/Layout'
import { TennaQuickLinks } from './components/QuickLinks'

export function DeltaSettingsScreen() {
  const {gtMobile} = useBreakpoints()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Deltas</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[a.pt_2xl, a.px_lg, gtMobile && a.px_2xl]}>
          <TennaQuickLinks/>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}