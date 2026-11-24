import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {getHomeNavigationAction} from '#/lib/routes/navigation'
import {type NavigationProp} from '#/lib/routes/types'

export function AuthCallback() {
  const navigation = useNavigation<NavigationProp>()

  useEffect(() => {
    // Web OAuth callback route — not used on native.
    navigation.dispatch(
      getHomeNavigationAction(navigation.getState(), 'replace'),
    )
  }, [navigation])

  return null
}
