import {useEffect, useState} from 'react'
import {StyleSheet, useWindowDimensions, View} from 'react-native'

import {registerSixSevenControls} from '#/features/sixSeven/celebrate'
import {ConfettiBurst} from '#/features/sixSeven/ConfettiBurst'
import {IS_WEB} from '#/env'

export function SixSevenOutlet() {
  const {width, height} = useWindowDimensions()
  const [bursts, setBursts] = useState<number[]>([])

  useEffect(() => {
    registerSixSevenControls({
      burst: () => {
        setBursts(prev => [...prev, Date.now()])
      },
    })
    return () => registerSixSevenControls(null)
  }, [])

  if (bursts.length === 0) {
    return null
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.viewport,
        {
          width,
          height,
          position: IS_WEB ? 'fixed' : 'absolute',
        },
      ]}>
      {bursts.map(id => (
        <ConfettiBurst
          key={id}
          onComplete={() => {
            setBursts(prev => prev.filter(burstId => burstId !== id))
          }}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  viewport: {
    top: 0,
    left: 0,
    zIndex: 9999,
    elevation: 9999,
  },
})
