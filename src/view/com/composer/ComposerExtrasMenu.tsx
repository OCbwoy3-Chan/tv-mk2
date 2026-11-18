import {useLingui} from '@lingui/react/macro'

import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {Button} from '#/components/Button'
import {CalendarDays_Stroke2_Corner0_Rounded as CalendarIcon} from '#/components/icons/CalendarDays'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
import {Poll_Stroke2_Corner0_Rounded as PollIcon} from '#/components/icons/Poll'
import * as Menu from '#/components/Menu'
import {useAnalytics} from '#/analytics'

/**
 * The poll and event buttons, folded into one menu when the composer's
 * toolbar is too narrow to show them alongside everything else.
 */
export function ComposerExtrasMenu({
  canAddPoll,
  canAddEvent,
  onAddPoll,
  onAddEvent,
}: {
  canAddPoll: boolean
  canAddEvent: boolean
  onAddPoll: () => void
  onAddEvent: () => void
}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const squareButtons = useEnableSquareButtons()

  return (
    <Menu.Root>
      <Menu.Trigger label={l`More attachments`}>
        {({props}) => (
          <Button
            testID="composerExtrasBtn"
            {...props}
            label={props.accessibilityLabel}
            style={{padding: 8}}
            variant="ghost"
            shape={squareButtons ? 'square' : 'round'}
            color="primary"
            disabled={!canAddPoll && !canAddEvent}>
            <DotsIcon size="lg" />
          </Button>
        )}
      </Menu.Trigger>
      <Menu.Outer showCancel>
        <Menu.Group>
          <Menu.Item
            testID="composerExtrasPoll"
            label={l`Add poll`}
            disabled={!canAddPoll}
            onPress={() => {
              ax.metric('composer:poll:open', {})
              onAddPoll()
            }}>
            <Menu.ItemText>{l`Poll`}</Menu.ItemText>
            <Menu.ItemIcon icon={PollIcon} />
          </Menu.Item>
          <Menu.Item
            testID="composerExtrasEvent"
            label={l`Add event`}
            disabled={!canAddEvent}
            onPress={() => {
              ax.metric('composer:event:open', {})
              onAddEvent()
            }}>
            <Menu.ItemText>{l`Event`}</Menu.ItemText>
            <Menu.ItemIcon icon={CalendarIcon} />
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
