import {type ReactNode} from 'react'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import * as Layout from '#/components/Layout'

export function RunesScreenLayout({
  titleText,
  children,
}: {
  titleText: string
  children: ReactNode
}) {
  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>{titleText}</Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>{children}</SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
