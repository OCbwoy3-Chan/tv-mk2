export type EditorSliderProps = {
  label: string
  testID: string
  value: number
  minimum: number
  maximum: number
  step: number
  disabled: boolean
  onChange: (value: number) => void
}
