import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {type CountsMetricsDisplay} from '#/lib/metrics-display'
import {useRequireAuth, useSession} from '#/state/session'
import {EventStopper} from '#/view/com/util/EventStopper'
import {useTheme} from '#/alf'
import {CloseQuote_Stroke2_Corner1_Rounded as Quote} from '#/components/icons/Quote'
import {Repost_Stroke2_Corner2_Rounded as Repost} from '#/components/icons/Repost'
import * as Menu from '#/components/Menu'
import {MetricCountLabel} from './MetricCountLabel'
import {PostControlButton, PostControlButtonIcon} from './PostControlButton'

interface Props {
  isReposted: boolean
  repostCount?: number
  metricsDisplay?: CountsMetricsDisplay
  onRepost: () => void
  onQuote: () => void
  onLongPress?: () => void
  big?: boolean
  embeddingDisabled: boolean
}

export const RepostButton = ({
  isReposted,
  repostCount,
  metricsDisplay = 'visible',
  onRepost,
  onQuote,
  onLongPress,
  big,
  embeddingDisabled,
}: Props) => {
  const t = useTheme()
  const {_} = useLingui()
  const {hasSession} = useSession()
  const requireAuth = useRequireAuth()

  return hasSession ? (
    <EventStopper onKeyDown={false}>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Repost or quote post`)}>
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
                ? _(msg`Undo repost`)
                : _(msg({message: `Repost`, context: `action`}))
            }
            testID="repostDropdownRepostBtn"
            onPress={onRepost}>
            <Menu.ItemText>
              {isReposted
                ? _(msg`Undo repost`)
                : _(msg({message: `Repost`, context: `action`}))}
            </Menu.ItemText>
            <Menu.ItemIcon icon={Repost} position="right" />
          </Menu.Item>
          <Menu.Item
            disabled={embeddingDisabled}
            label={
              embeddingDisabled
                ? _(msg`Quote posts disabled`)
                : _(msg`Quote post`)
            }
            testID="repostDropdownQuoteBtn"
            onPress={onQuote}>
            <Menu.ItemText>
              {embeddingDisabled
                ? _(msg`Quote posts disabled`)
                : _(msg`Quote post`)}
            </Menu.ItemText>
            <Menu.ItemIcon icon={Quote} position="right" />
          </Menu.Item>
        </Menu.Outer>
      </Menu.Root>
    </EventStopper>
  ) : (
    <PostControlButton
      onPress={() => requireAuth(() => {})}
      active={isReposted}
      activeColor={t.palette.positive_500}
      label={_(msg`Repost or quote post`)}
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
