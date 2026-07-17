import {type ComponentType, type RefObject} from 'react'
import {type TextInput} from 'react-native'

import {type Props as SVGIconProps} from '#/components/icons/common'

export type HandleAutocompleteInputProps = {
  initialValue?: string
  onValueChange: (value: string) => void
  onSubmit?: () => void
  onSubmitEditing?: () => void
  /** When true (default), selecting a suggestion triggers onSubmit. */
  submitOnSelect?: boolean
  editable?: boolean
  autoFocus?: boolean
  testID?: string
  label: string
  placeholder?: string | null
  accessibilityHint?: string
  icon?: ComponentType<SVGIconProps>
  isInvalid?: boolean
  returnKeyType?: 'next' | 'done'
  inputRef?: RefObject<TextInput | null>
  /** When false, suppresses the typeahead dropdown (e.g. when input looks like email). */
  showAutocomplete?: boolean
  onFocus?: () => void
  onBlur?: () => void
}
