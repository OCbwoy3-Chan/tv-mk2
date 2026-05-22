import {useState} from 'react'
import {ScrollView, View} from 'react-native'
import {Image} from 'expo-image'
import {type AppBskyActorDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {Text} from '#/components/Typography'
import {PluralHelpDialog} from '#/features/plurality/components/PluralHelpDialog'
import {SystemMemberDialog} from '#/features/plurality/components/SystemMemberDialog'
import {usePluralFrontingQuery} from '#/features/plurality/queries'
import {type PluralSystemMember} from '#/features/plurality/types'
import {pluralMemberBlobUrl} from '#/features/plurality/utils'

export function ProfileFronting({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const {data} = usePluralFrontingQuery({did: profile.did})

  if (!data?.fronters.length) {
    return null
  }

  return (
    <ProfileFrontingInner
      profileDid={profile.did}
      authorHandle={profile.handle}
      pdsUrl={data.pdsUrl}
      fronters={data.fronters}
    />
  )
}

function ProfileFrontingInner({
  profileDid,
  authorHandle,
  pdsUrl,
  fronters,
}: {
  profileDid: string
  authorHandle: string
  pdsUrl: string
  fronters: PluralSystemMember[]
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const enableSquareButtons = useEnableSquareButtons()
  const chipCorners = enableSquareButtons ? a.rounded_sm : a.rounded_full
  const helpControl = Dialog.useDialogControl()
  const memberControl = Dialog.useDialogControl()
  const [selectedMember, setSelectedMember] =
    useState<PluralSystemMember | null>(null)
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<
    string | undefined
  >(undefined)

  const onMemberPress = (member: PluralSystemMember) => {
    const avatarUrl =
      member.avatar &&
      pluralMemberBlobUrl({pdsUrl, did: profileDid, blob: member.avatar})
    setSelectedMember(member)
    setSelectedAvatarUrl(avatarUrl)
    memberControl.open()
  }

  return (
    <>
      <View style={[a.flex_row, a.align_center, a.gap_sm, {minWidth: 0}]}>
        <View style={[a.flex_row, a.align_center, a.gap_xs, a.flex_shrink_0]}>
          <Text
            style={[
              a.text_xs,
              a.font_bold,
              t.atoms.text_contrast_medium,
              {textTransform: 'uppercase'},
            ]}>
            <Trans>Fronting</Trans>
          </Text>
          <Button
            label={l`Learn about fronting`}
            size="tiny"
            color="secondary"
            shape="round"
            onPress={() => helpControl.open()}>
            <ButtonIcon icon={CircleInfoIcon} />
          </Button>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[a.flex_1, web({minWidth: 0})]}
          contentContainerStyle={[a.flex_row, a.align_center, a.gap_xs]}>
          {fronters.map(member => {
            const displayName = member.displayName || member.name || l`Member`
            const avatarUrl =
              member.avatar &&
              pluralMemberBlobUrl({
                pdsUrl,
                did: profileDid,
                blob: member.avatar,
              })

            return (
              <Button
                key={member.createdAt + displayName}
                label={displayName}
                size="small"
                color="secondary"
                onPress={() => onMemberPress(member)}
                style={[
                  a.flex_row,
                  a.align_center,
                  t.atoms.bg,
                  chipCorners,
                  avatarUrl
                    ? [a.gap_xs, a.pr_sm, a.pl_2xs, a.py_2xs]
                    : [a.justify_center, a.px_sm, a.py_xs],
                ]}>
                {avatarUrl ? (
                  <View
                    style={[
                      chipCorners,
                      a.overflow_hidden,
                      {width: 24, height: 24},
                    ]}>
                    <Image
                      source={{uri: avatarUrl}}
                      accessibilityIgnoresInvertColors
                      style={{width: 24, height: 24}}
                      contentFit="cover"
                    />
                  </View>
                ) : null}
                <ButtonText
                  style={[a.text_xs, !avatarUrl && {textAlign: 'center'}]}>
                  {displayName}
                </ButtonText>
              </Button>
            )
          })}
        </ScrollView>
      </View>

      <PluralHelpDialog control={helpControl} />
      {selectedMember ? (
        <SystemMemberDialog
          control={memberControl}
          member={selectedMember}
          avatarUrl={selectedAvatarUrl}
          authorHandle={authorHandle}
        />
      ) : null}
    </>
  )
}
