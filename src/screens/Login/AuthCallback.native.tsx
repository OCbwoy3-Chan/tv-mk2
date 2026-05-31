import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'

export function AuthCallback() {
  const navigation = useNavigation<NavigationProp>()

  useEffect(() => {
    // Web OAuth callback route — not used on native.
    navigation.replace('Home')
  }, [navigation])

  return null
}
