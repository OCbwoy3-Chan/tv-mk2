import {useEffect, useState} from 'react'

import {registerSixSevenControls} from '#/features/sixSeven/celebrate'
import {ConfettiBurst} from '#/features/sixSeven/ConfettiBurst'

export function SixSevenOutlet() {
  const [bursts, setBursts] = useState<number[]>([])

  useEffect(() => {
    registerSixSevenControls({
      burst: () => {
        setBursts(prev => [...prev, Date.now()])
      },
    })
    return () => registerSixSevenControls(null)
  }, [])

  return (
    <>
      {bursts.map(id => (
        <ConfettiBurst
          key={id}
          onComplete={() => {
            setBursts(prev => prev.filter(burstId => burstId !== id))
          }}
        />
      ))}
    </>
  )
}
