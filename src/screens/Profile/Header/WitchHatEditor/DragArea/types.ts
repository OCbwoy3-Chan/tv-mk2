import {type HatPlacement} from '#/screens/Profile/Header/WitchHatEditor/utils'

export type DragAreaProps = {
  placement: HatPlacement
  previewSize: number
  disabled: boolean
  onChange: React.Dispatch<React.SetStateAction<HatPlacement>>
}
