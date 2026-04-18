import { useRef, useState } from 'react'
import CesiumViewer, { type CesiumViewerHandle } from './cesium/CesiumViewer'
import WindPanel from './components/WindPanel'
import { useWindState } from './hooks/useWindState'
import { useVAWTState } from './hooks/useVAWTState'

export default function App() {
  const viewerRef = useRef<CesiumViewerHandle>(null)
  const wind = useWindState()
  const vawtState = useVAWTState()
  const [particleCount, setParticleCount] = useState(1000)
  const [particleRadius, setParticleRadius] = useState(300)

  return (
    <div className="relative w-full h-full">
      <CesiumViewer
        ref={viewerRef}
        windSpeed={wind.speed}
        windDirection={wind.direction}
        gustEnabled={wind.gustEnabled}
        particleCount={particleCount}
        particleRadius={particleRadius}
        placingMode={vawtState.placingMode}
        vawts={vawtState.vawts}
        onPlace={vawtState.addVAWT}
      />
      <WindPanel
        wind={wind}
        onFlyTo={(lon, lat) => viewerRef.current?.flyTo(lon, lat)}
        vawt={vawtState}
        particleCount={particleCount}
        setParticleCount={setParticleCount}
        particleRadius={particleRadius}
        setParticleRadius={setParticleRadius}
      />
    </div>
  )
}
