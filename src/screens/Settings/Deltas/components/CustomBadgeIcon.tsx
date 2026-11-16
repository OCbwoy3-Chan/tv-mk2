import { type PathProps, type SvgProps } from 'react-native-svg'
import { Image, type ImageProps } from 'expo-image'

export function CustomBadgeIcon({
    fill,
    source,
    ...rest
}: { fill?: PathProps['fill'] } & SvgProps & ImageProps) {
    // @ts-ignore it's fiiiiine
    const size = parseInt(rest.width || 24);

    return (
        <Image
            source={source}
            accessibilityLabel=""
            accessibilityHint=""
            accessibilityIgnoresInvertColors
            style={{ width: size, height: size }}
        />
    )
}
