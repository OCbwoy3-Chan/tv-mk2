import {useLingui} from '@lingui/react/macro'

import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as Prompt from '#/components/Prompt'

/**
 * The close button on an editor card in the composer (poll, event). When the
 * card has anything typed into it, removing asks first, since that work would
 * be lost.
 */
export function EmbedEditorRemoveBtn({
  testID,
  label,
  confirm,
  promptTitle,
  promptDescription,
  onRemove,
}: {
  testID?: string
  label: string
  confirm: boolean
  promptTitle: string
  promptDescription: string
  onRemove: () => void
}) {
  const {t: l} = useLingui()
  const squareButtons = useEnableSquareButtons()
  const prompt = Prompt.usePromptControl()

  return (
    <>
      <Button
        testID={testID}
        label={label}
        size="tiny"
        variant="ghost"
        color="secondary"
        shape={squareButtons ? 'square' : 'round'}
        onPress={() => (confirm ? prompt.open() : onRemove())}>
        <ButtonIcon icon={XIcon} />
      </Button>
      <Prompt.Basic
        control={prompt}
        title={promptTitle}
        description={promptDescription}
        confirmButtonCta={l`Remove`}
        confirmButtonColor="negative"
        onConfirm={onRemove}
      />
    </>
  )
}
