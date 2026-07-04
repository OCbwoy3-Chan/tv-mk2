import {useEffect, useRef, useState} from 'react'
import {StyleSheet, useWindowDimensions, View} from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {Portal} from '#/components/Portal'

const COLORS = [
  '#FF6B6B',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#FF6BD6',
  '#FF9F43',
  '#C56CF0',
  '#18DCFF',
]

const SPAWN_DURATION_MS = 1500
const PARTICLE_LIFETIME_MS = 3000
const SPAWN_INTERVAL_MS = 45

type Origin = 'top' | 'bottomLeft' | 'bottomRight'

type Particle = {
  id: number
  color: string
  startX: number
  startY: number
  endX: number
  endY: number
  size: number
  spin: number
}

function createRandomParticle(
  id: number,
  width: number,
  height: number,
): Particle {
  const origins: Origin[] = ['top', 'bottomLeft', 'bottomRight']
  const origin = origins[Math.floor(Math.random() * origins.length)]!
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]!

  if (origin === 'top') {
    const startX = Math.random() * width
    return {
      id,
      color,
      startX,
      startY: -24,
      endX: startX + (Math.random() - 0.5) * 180,
      endY: height + 32,
      size: 6 + Math.random() * 8,
      spin: (Math.random() - 0.5) * 1080,
    }
  }

  const spread = 0.55 + Math.random() * 0.45
  const arcHeight = height * (0.45 + Math.random() * 0.45)

  if (origin === 'bottomLeft') {
    const startX = Math.random() * 48
    const startY = height + Math.random() * 24
    return {
      id,
      color,
      startX,
      startY,
      endX: startX + width * spread * (0.35 + Math.random() * 0.65),
      endY: startY - arcHeight,
      size: 7 + Math.random() * 9,
      spin: (Math.random() - 0.5) * 1260,
    }
  }

  const startX = width - Math.random() * 48
  const startY = height + Math.random() * 24
  return {
    id,
    color,
    startX,
    startY,
    endX: startX - width * spread * (0.35 + Math.random() * 0.65),
    endY: startY - arcHeight,
    size: 7 + Math.random() * 9,
    spin: (Math.random() - 0.5) * 1260,
  }
}

function spawnBatch(
  width: number,
  height: number,
  startId: number,
): Particle[] {
  const count = 4 + Math.floor(Math.random() * 4)
  return Array.from({length: count}, (_, index) =>
    createRandomParticle(startId + index, width, height),
  )
}

function ConfettiPiece({particle}: {particle: Particle}) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.set(() =>
      withTiming(1, {
        duration: PARTICLE_LIFETIME_MS,
        easing: Easing.out(Easing.cubic),
      }),
    )
  }, [progress])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.get(),
          [0, 1],
          [particle.startX, particle.endX],
        ),
      },
      {
        translateY: interpolate(
          progress.get(),
          [0, 1],
          [particle.startY, particle.endY],
        ),
      },
      {rotate: `${particle.spin * progress.get()}deg`},
    ],
    opacity: interpolate(progress.get(), [0, 0.06, 0.88, 1], [0, 1, 1, 0]),
  }))

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: particle.size,
          height: particle.size * 0.65,
          borderRadius: 2,
          backgroundColor: particle.color,
        },
      ]}
    />
  )
}

export function ConfettiBurst({onComplete}: {onComplete: () => void}) {
  const {width, height} = useWindowDimensions()
  const [particles, setParticles] = useState<Particle[]>([])
  const nextId = useRef(0)

  useEffect(() => {
    const spawn = () => {
      const batch = spawnBatch(width, height, nextId.current)
      nextId.current += batch.length
      setParticles(prev => [...prev, ...batch])
    }

    spawn()

    const interval = setInterval(spawn, SPAWN_INTERVAL_MS)
    const stopSpawning = setTimeout(() => {
      clearInterval(interval)
    }, SPAWN_DURATION_MS)

    const finish = setTimeout(() => {
      onComplete()
    }, SPAWN_DURATION_MS + PARTICLE_LIFETIME_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(stopSpawning)
      clearTimeout(finish)
    }
  }, [width, height, onComplete])

  return (
    <Portal>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
        {particles.map(particle => (
          <ConfettiPiece key={particle.id} particle={particle} />
        ))}
      </View>
    </Portal>
  )
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 9999,
    elevation: 9999,
  },
})
