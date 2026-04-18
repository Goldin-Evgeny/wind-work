import { useState, useRef, useCallback } from 'react'
import * as Cesium from 'cesium'

export type MountType = 'rooftop' | 'corner'

export interface PlacedVAWT {
  id: string
  label: string
  position: Cesium.Cartesian3
  mountType: MountType
}

export function useVAWTState() {
  const [vawts, setVawts] = useState<PlacedVAWT[]>([])
  const [placingMode, setPlacingMode] = useState(false)
  const [mountType, setMountType] = useState<MountType>('rooftop')
  const counter = useRef(0)

  const addVAWT = useCallback((position: Cesium.Cartesian3) => {
    counter.current += 1
    setVawts(prev => [...prev, {
      id: crypto.randomUUID(),
      label: `VAWT ${counter.current}`,
      position,
      mountType,
    }])
    setPlacingMode(false)
  }, [mountType])

  const removeVAWT = useCallback((id: string) => {
    setVawts(prev => prev.filter(v => v.id !== id))
  }, [])

  return { vawts, placingMode, setPlacingMode, mountType, setMountType, addVAWT, removeVAWT }
}
