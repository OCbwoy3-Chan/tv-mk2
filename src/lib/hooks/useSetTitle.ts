import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {useTitleUnreadCountLabel} from '#/lib/hooks/useTitleUnreadCountLabel'
import {type NavigationProp} from '#/lib/routes/types'
import {bskyTitle} from '#/lib/strings/headings'

export function useSetTitle(title?: string) {
  const navigation = useNavigation<NavigationProp>()
  const unreadCountLabel = useTitleUnreadCountLabel()
  useEffect(() => {
    if (title) {
      navigation.setOptions({title: bskyTitle(title, unreadCountLabel)})
    }
  }, [title, navigation, unreadCountLabel])
}
