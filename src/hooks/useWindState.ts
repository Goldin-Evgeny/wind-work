import { useState } from 'react'

export interface WindState {
  speed: number
  direction: number
  gustEnabled: boolean
}

export function useWindState() {
  const [speed, setSpeed] = useState(5)
  const [direction, setDirection] = useState(270)
  const [gustEnabled, setGustEnabled] = useState(false)
  return { speed, direction, gustEnabled, setSpeed, setDirection, setGustEnabled }
}
