import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {type CountsMetricsDisplay} from '#/lib/metrics-display'
import {useRequireAuth, useSession} from '#/state/session'
import {EventStopper} from '#/view/com/util/EventStopper'
import {useTheme} from '#/alf'
import {CloseQuote_Stroke2_Corner1_Rounded as Quote} from '#/components/icons/Quote'
import {
  Repost_Stroke2_Corner2_Rounded as Repost,
  RepostRepost_Stroke2_Corner2_Rounded as BumpRepostIcon,
} from '#/components/icons/Repost'
import * as Menu from '#/components/Menu'
import {usePostKeyboardActions} from '#/features/keyboardShortcuts/postActions.web'
import {MetricCountLabel} from './MetricCountLabel'
import {PostControlButton, PostControlButtonIcon} from './PostControlButton'

interface Props {
  isReposted: boolean
  repostCount?: number
  metricsDisplay?: CountsMetricsDisplay
  onRepost: () => void
  onBumpRepost: () => void
  onQuote: (openAccountSwitcher?: boolean) => void
  onLongPress?: () => void
  big?: boolean
  embeddingDisabled: boolean
}

export const RepostButton = ({
  isReposted,
  repostCount,
  metricsDisplay = 'visible',
  onRepost,
  onBumpRepost,
  onQuote,
  onLongPress,
  big,
  embeddingDisabled,
}: Props) => {
  const t = useTheme()
  const {t: l} = useLingui()
  const {hasSession} = useSession()
  const requireAuth = useRequireAuth()

  const keyboardActionsRef = usePostKeyboardActions({
    onRepost,
    onQuote,
    embeddingDisabled,
    enabled: hasSession,
  })

  return hasSession ? (
    <div ref={keyboardActionsRef} style={{display: 'contents'}}>
      <EventStopper onKeyDown={false}>
        <Menu.Root>
          <Menu.Trigger label={l`Repost or quote post`}>
            {({props}) => {
              return (
                <PostControlButton
                  testID="repostBtn"
                  active={isReposted}
                  activeColor={t.palette.positive_500}
                  label={props.accessibilityLabel}
                  big={big}
                  onLongPress={onLongPress}
                  {...props}>
                  <PostControlButtonIcon icon={Repost} />
                  {typeof repostCount !== 'undefined' ? (
                    <MetricCountLabel
                      display={metricsDisplay}
                      count={repostCount}
                      testID="repostCount"
                      labelOnly={plural(repostCount, {
                        one: 'repost',
                        other: 'reposts',
                      })}
                    />
                  ) : null}
                </PostControlButton>
              )
            }}
          </Menu.Trigger>
          <Menu.Outer style={{minWidth: 170}}>
            <Menu.Item
              label={
                isReposted
                  ? l`Undo repost`
                  : l({message: `Repost`, context: `action`})
              }
              testID="repostDropdownRepostBtn"
              onPress={onRepost}>
              <Menu.ItemText>
                {isReposted
                  ? l`Undo repost`
                  : l({message: `Repost`, context: `action`})}
              </Menu.ItemText>
              <Menu.ItemIcon icon={Repost} position="right" />
            </Menu.Item>
            {isReposted && (
              <Menu.Item
                label={l`Bump repost`}
                testID="repostDropdownBumpBtn"
                onPress={onBumpRepost}>
                <Menu.ItemText>{l`Bump repost`}</Menu.ItemText>
                <Menu.ItemIcon icon={BumpRepostIcon} position="right" />
              </Menu.Item>
            )}
            <Menu.Item
              disabled={embeddingDisabled}
              label={
                embeddingDisabled ? l`Quote posts disabled` : l`Quote post`
              }
              testID="repostDropdownQuoteBtn"
              onPress={() => onQuote()}>
              <Menu.ItemText>
                {embeddingDisabled ? l`Quote posts disabled` : l`Quote post`}
              </Menu.ItemText>
              <Menu.ItemIcon icon={Quote} position="right" />
            </Menu.Item>
          </Menu.Outer>
        </Menu.Root>
      </EventStopper>
    </div>
  ) : (
    <PostControlButton
      onPress={() => requireAuth(() => {})}
      active={isReposted}
      activeColor={t.palette.positive_500}
      label={l`Repost or quote post`}
      big={big}>
      <PostControlButtonIcon icon={Repost} />
      {typeof repostCount !== 'undefined' ? (
        <MetricCountLabel
          display={metricsDisplay}
          count={repostCount}
          testID="repostCount"
          labelOnly={plural(repostCount, {
            one: 'repost',
            other: 'reposts',
          })}
        />
      ) : null}
    </PostControlButton>
  )
}
