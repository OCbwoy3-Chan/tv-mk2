import {useEffect, useMemo, useRef, useState} from 'react'
import {StyleSheet, useWindowDimensions, View} from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {useTheme} from '#/alf'
import {type Palette} from '#/alf/themes'

const SPAWN_DURATION_MS = 2000
const PARTICLE_LIFETIME_MS = 3000
const SPAWN_INTERVAL_MS = 140

type ParticleType = 'square' | 'rectangle' | 'circle'

type Particle = {
  id: number
  color: string
  type: ParticleType
  startX: number
  startY: number
  endX: number
  endY: number
  baseWidth: number
  baseHeight: number
  borderRadius: number
  flipCycles: number
  tilt: number
}

function getConfettiColors(palette: Palette): string[] {
  return [
    palette.primary_300,
    palette.primary_400,
    palette.primary_500,
    palette.primary_600,
    palette.positive_400,
    palette.positive_500,
    palette.pink,
    palette.yellow,
    palette.like,
  ]
}

function pickParticleType(): ParticleType {
  const types: ParticleType[] = ['square', 'rectangle', 'circle']
  return types[Math.floor(Math.random() * types.length)]!
}

function getParticleDimensions(type: ParticleType): {
  baseWidth: number
  baseHeight: number
  borderRadius: number
} {
  switch (type) {
    case 'square':
      return {
        baseWidth: 7 + Math.random() * 5,
        baseHeight: 7 + Math.random() * 5,
        borderRadius: 2,
      }
    case 'rectangle':
      return {
        baseWidth: 11 + Math.random() * 9,
        baseHeight: 4 + Math.random() * 4,
        borderRadius: 1,
      }
    case 'circle':
      return {
        baseWidth: 6 + Math.random() * 5,
        baseHeight: 6 + Math.random() * 5,
        borderRadius: 999,
      }
  }
}

function createRandomParticle(
  id: number,
  width: number,
  height: number,
  colors: string[],
): Particle {
  const centerX = width / 2
  const startX = centerX + (Math.random() - 0.5) * 32
  const startY = Math.random() * 12
  const angle = (Math.random() - 0.5) * 1.75
  const travel = height * (0.08 + Math.random() * 0.67)
  const type = pickParticleType()
  const dimensions = getParticleDimensions(type)

  return {
    id,
    color: colors[Math.floor(Math.random() * colors.length)]!,
    type,
    startX,
    startY,
    endX: centerX + Math.sin(angle) * travel,
    endY: startY + Math.abs(Math.cos(angle)) * travel,
    baseWidth: dimensions.baseWidth,
    baseHeight: dimensions.baseHeight,
    borderRadius: dimensions.borderRadius,
    flipCycles: 2 + Math.random() * 5,
    tilt: (Math.random() - 0.5) * 540,
  }
}

function spawnBatch(
  width: number,
  height: number,
  startId: number,
  colors: string[],
): Particle[] {
  const count = 1 + Math.floor(Math.random() * 2)
  return Array.from({length: count}, (_, index) =>
    createRandomParticle(startId + index, width, height, colors),
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

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get()
    const flip = Math.abs(Math.cos(p * particle.flipCycles * Math.PI * 2))
    const visibleWidth = particle.baseWidth * Math.max(0.1, flip)

    return {
      transform: [
        {
          translateX: interpolate(p, [0, 1], [particle.startX, particle.endX]),
        },
        {
          translateY: interpolate(p, [0, 1], [particle.startY, particle.endY]),
        },
        {rotate: `${particle.tilt * p}deg`},
      ],
      width: visibleWidth,
      height: particle.baseHeight,
      opacity: interpolate(p, [0, 0.06, 0.88, 1], [0, 1, 1, 0]),
    }
  })

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          borderRadius: particle.borderRadius,
          backgroundColor: particle.color,
        },
      ]}
    />
  )
}

export function ConfettiBurst({onComplete}: {onComplete: () => void}) {
  const t = useTheme()
  const {width, height} = useWindowDimensions()
  const [particles, setParticles] = useState<Particle[]>([])
  const nextId = useRef(0)
  const colors = useMemo(() => getConfettiColors(t.palette), [t.palette])

  useEffect(() => {
    const spawn = () => {
      const batch = spawnBatch(width, height, nextId.current, colors)
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
  }, [width, height, onComplete, colors])

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      {particles.map(particle => (
        <ConfettiPiece key={particle.id} particle={particle} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 9999,
    elevation: 9999,
  },
})
