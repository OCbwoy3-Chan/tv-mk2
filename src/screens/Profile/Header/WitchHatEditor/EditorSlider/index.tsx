import {View} from 'react-native'
import {Slider} from '@miblanchard/react-native-slider'

import {type EditorSliderProps} from '#/screens/Profile/Header/WitchHatEditor/EditorSlider/types'
import {useTheme} from '#/alf'

export function EditorSlider({
  label,
  testID,
  value,
  minimum,
  maximum,
  step,
  disabled,
  onChange,
}: EditorSliderProps) {
  const t = useTheme()
  return (
    <View
      accessibilityLabel={label}
      accessibilityHint={undefined}
      testID={testID}>
      <Slider
        value={value}
        minimumValue={minimum}
        maximumValue={maximum}
        step={step}
        disabled={disabled}
        onValueChange={values => onChange(values[0])}
        minimumTrackTintColor={t.palette.primary_500}
        maximumTrackTintColor={t.palette.contrast_100}
        thumbTintColor={t.palette.primary_500}
      />
    </View>
  )
}
