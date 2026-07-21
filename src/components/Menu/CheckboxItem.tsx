import {useState} from 'react'

import {atoms as a} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'

export function CheckboxItemText({
  children,
  initialValue,
  label,
  onChange,
}: React.PropsWithChildren<{
  initialValue: boolean
  label: string
  onChange: (value: boolean) => void
}>) {
  const [selected, setSelected] = useState(initialValue)

  return (
    <Toggle.Item
      name="menu_checkbox"
      label={label}
      value={selected}
      onChange={value => {
        setSelected(value)
        onChange(value)
      }}
      style={[a.flex_1, a.justify_between]}>
      <Toggle.LabelText style={[a.flex_1, a.text_md]}>
        {children}
      </Toggle.LabelText>
      <Toggle.Checkbox />
    </Toggle.Item>
  )
}
