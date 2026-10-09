import {View} from 'react-native'

import {isSpacesCompatiblePDS} from '#/lib/spaces'
import {
  usePrivatePostsAppViewDID,
  usePrivatePostsAppViewURL,
} from '#/state/preferences/private-posts-appview'
import {useAgent} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button} from '#/components/Button'
import {Text} from '#/components/Typography'

export function PrivatePostPlayground() {
  const t = useTheme()
  const agent = useAgent()

  const [appviewDid] = usePrivatePostsAppViewDID()
  const appviewUrl = usePrivatePostsAppViewURL()

  return (
    <View style={[a.gap_xl]}>
      <View style={[a.gap_sm]}>
        <Text style={[a.text_2xl, a.font_bold]}>privatevessel debug</Text>
      </View>
      <Admonition type="warning">
        check inspect element console for result
      </Admonition>
      <Text>
        privatevessel did: {appviewDid}
        {'\n'}
        privatevessel url: {appviewUrl}
      </Text>
      <Button
        onPress={async () => {
          try {
            const r = await isSpacesCompatiblePDS(agent)
            console.log('spaces compat check:', r)
          } catch (a_) {
            console.log(a_)
          }
        }}
        style={[t.atoms.bg_contrast_50, a.rounded_lg, a.p_sm]}
        label="check isSpacesCompatiblePDS">
        <Text>check isSpacesCompatiblePDS</Text>
      </Button>
    </View>
  )
}
