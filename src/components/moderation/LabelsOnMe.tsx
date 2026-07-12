import {type StyleProp, View, type ViewStyle} from 'react-native'
import {type AppBskyFeedDefs, type ComAtprotoLabelDefs} from '@atproto/api'
import {Plural, useLingui} from '@lingui/react/macro'

import {filterUserFacingLabels} from '#/lib/moderation'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {
  Button,
  ButtonIcon,
  type ButtonSize,
  ButtonText,
} from '#/components/Button'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {
  LabelsOnMeDialog,
  useLabelsOnMeDialogControl,
} from '#/components/moderation/LabelsOnMeDialog'

export function LabelsOnMe({
  type = 'account',
  labels,
  size,
  style,
}: {
  type?: 'account' | 'content'
  labels: ComAtprotoLabelDefs.Label[] | undefined
  size?: ButtonSize
  style?: StyleProp<ViewStyle>
}) {
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const control = useLabelsOnMeDialogControl()

  if (!labels || !currentAccount) {
    return null
  }
  labels = filterUserFacingLabels(labels, currentAccount.did).filter(
    label => !(label.val === 'pet' && label.src === currentAccount.did),
  )
  if (!labels.length) {
    return null
  }

  return (
    <View style={[a.flex_row, style]}>
      <LabelsOnMeDialog control={control} labels={labels} type={type} />

      <Button
        variant="solid"
        color="secondary"
        size={size || 'small'}
        label={l`View information about these labels`}
        onPress={() => {
          control.open()
        }}>
        <ButtonIcon position="left" icon={CircleInfo} />
        <ButtonText style={[a.leading_snug]}>
          {type === 'account' ? (
            <Plural
              value={labels.length}
              one="# account label"
              other="# account labels"
            />
          ) : (
            <Plural
              value={labels.length}
              one="# content label"
              other="# content labels"
            />
          )}
        </ButtonText>
      </Button>
    </View>
  )
}

export function LabelsOnMyPost({
  post,
  style,
}: {
  post: AppBskyFeedDefs.PostView
  style?: StyleProp<ViewStyle>
}) {
  const {currentAccount} = useSession()
  if (post.author.did !== currentAccount?.did) {
    return null
  }
  return (
    <LabelsOnMe
      type="content"
      labels={post.labels}
      size="tiny"
      style={style}
    />
  )
}
