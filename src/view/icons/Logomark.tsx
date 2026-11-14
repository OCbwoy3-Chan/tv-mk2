import {type PathProps, type SvgProps} from 'react-native-svg'

import {Logo} from '#/view/icons/Logo'

export function Logomark(props: {fill?: PathProps['fill']} & SvgProps) {
  return <Logo {...props} allowVariants={false} />
}
