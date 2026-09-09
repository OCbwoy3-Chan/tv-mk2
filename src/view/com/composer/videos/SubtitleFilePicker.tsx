import {useRef, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {srtToVtt} from '#/lib/media/video/srtToVtt'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {CC_Stroke2_Corner0_Rounded as CCIcon} from '#/components/icons/CC'
import * as Toast from '#/components/Toast'
import {type SubtitleFilePickerProps} from './SubtitleFilePicker.shared'

export function SubtitleFilePicker({
  onSelectFile,
  disabled,
  remainingSlots,
}: SubtitleFilePickerProps) {
  const {_} = useLingui()
  const [processing, setProcessing] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    ref.current?.click()
  }

  const handlePick = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(evt.target.files ?? [])
    evt.target.value = ''
    if (files.length > remainingSlots) {
      Toast.show(_(msg`You can upload up to 20 caption tracks.`))
      return
    }
    setProcessing(true)
    try {
      const converted = await Promise.all(
        files.map(async file => {
          let caption: File
          if (/\.srt$/i.test(file.name)) {
            caption = new File(
              [srtToVtt(await file.text())],
              file.name.replace(/\.srt$/i, '.vtt'),
              {type: 'text/vtt'},
            )
          } else if (/\.vtt$/i.test(file.name) || file.type === 'text/vtt') {
            caption = new File([file], file.name, {type: 'text/vtt'})
          } else {
            throw new Error('Unsupported caption format')
          }
          if (caption.size > 20000) throw new Error('Caption file too large')
          return caption
        }),
      )
      converted.forEach(onSelectFile)
    } catch {
      Toast.show(
        _(
          msg`Could not add captions. Use valid .vtt or .srt files, each under 20 KB after conversion.`,
        ),
      )
    } finally {
      setProcessing(false)
    }
  }

  return (
    <View style={a.gap_lg}>
      <input
        type="file"
        accept=".vtt,.srt"
        multiple
        ref={ref}
        style={a.hidden}
        onChange={event => {
          void handlePick(event)
        }}
        disabled={disabled || processing}
        aria-disabled={disabled || processing}
      />
      <View style={a.flex_row}>
        <Button
          onPress={handleClick}
          label={_(msg`Select caption files (.vtt or .srt)`)}
          size="large"
          color="primary"
          variant="solid"
          disabled={disabled || processing}>
          <ButtonIcon icon={CCIcon} />
          <ButtonText>
            <Trans>Select caption files (.vtt or .srt)</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
