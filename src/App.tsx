import { useRef } from 'react'
import CesiumViewer, { type CesiumViewerHandle } from './cesium/CesiumViewer'
import WindPanel from './components/WindPanel'
import { useWindState } from './hooks/useWindState'

export default function App() {
  const viewerRef = useRef<CesiumViewerHandle>(null)
  const wind = useWindState()

  return (
    <div className="relative w-full h-full">
      <CesiumViewer ref={viewerRef} />
      <WindPanel
        wind={wind}
        onFlyTo={(lon, lat) => viewerRef.current?.flyTo(lon, lat)}
      />
    </div>
  )
}
