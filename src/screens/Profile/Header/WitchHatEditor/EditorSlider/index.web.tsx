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
    <input
      type="range"
      aria-label={label}
      data-testid={testID}
      min={minimum}
      max={maximum}
      step={step}
      value={value}
      disabled={disabled}
      onChange={event => onChange(event.currentTarget.valueAsNumber)}
      style={{
        width: '100%',
        height: 40,
        margin: 0,
        touchAction: 'none',
        accentColor: t.palette.primary_500,
      }}
    />
  )
}
