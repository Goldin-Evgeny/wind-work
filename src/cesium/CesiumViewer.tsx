import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { WindParticleSystem } from './WindParticleSystem'
import { VAWTManager } from './VAWTManager'
import type { PlacedVAWT } from '../hooks/useVAWTState'

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN

const HOME = { lon: 34.964138, lat: 32.763391 }

export interface CesiumViewerHandle {
  flyTo: (lon: number, lat: number) => void
}

interface Props {
  windSpeed: number
  windDirection: number
  gustEnabled: boolean
  particleCount: number
  particleRadius: number
  placingMode: boolean
  vawts: PlacedVAWT[]
  onPlace: (pos: Cesium.Cartesian3) => void
}

const CesiumViewer = forwardRef<CesiumViewerHandle, Props>(
  ({ windSpeed, windDirection, gustEnabled, particleCount, particleRadius, placingMode, vawts, onPlace }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewerRef = useRef<Cesium.Viewer | null>(null)
    const particlesRef = useRef<WindParticleSystem | null>(null)
    const vawtMgrRef = useRef<VAWTManager | null>(null)
    // Refs so event handlers always see latest values without re-registering
    const placingRef = useRef(placingMode)
    const onPlaceRef = useRef(onPlace)
    useEffect(() => { placingRef.current = placingMode }, [placingMode])
    useEffect(() => { onPlaceRef.current = onPlace }, [onPlace])

    useImperativeHandle(ref, () => ({
      flyTo(lon, lat) {
        viewerRef.current?.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, 600),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 },
          duration: 2,
        })
      },
    }))

    // Initialise viewer once
    useEffect(() => {
      if (!containerRef.current || viewerRef.current) return

      const viewer = new Cesium.Viewer(containerRef.current, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        infoBox: false,
        selectionIndicator: false,
        baseLayerPicker: false,
        sceneModePicker: false,
        animation: false,
        timeline: false,
      })
      viewerRef.current = viewer

      Cesium.createOsmBuildingsAsync().then((osmBuildings) => {
        if (!viewer.isDestroyed()) viewer.scene.primitives.add(osmBuildings)
      })

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(HOME.lon, HOME.lat, 600),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 },
        duration: 3,
      })

      const homePos = Cesium.Cartesian3.fromDegrees(HOME.lon, HOME.lat, 0)
      particlesRef.current = new WindParticleSystem(viewer, homePos)
      vawtMgrRef.current = new VAWTManager(viewer)

      // Placement event handler
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

      handler.setInputAction((e: { endPosition: Cesium.Cartesian2 }) => {
        if (!placingRef.current) { vawtMgrRef.current?.hideCursor(); return }
        const pos = viewer.scene.pickPosition(e.endPosition)
        if (Cesium.defined(pos)) vawtMgrRef.current?.setCursor(pos)
        else vawtMgrRef.current?.hideCursor()
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

      handler.setInputAction((e: { position: Cesium.Cartesian2 }) => {
        if (!placingRef.current) return
        const pos = viewer.scene.pickPosition(e.position)
        if (Cesium.defined(pos)) {
          onPlaceRef.current(pos)
          vawtMgrRef.current?.hideCursor()
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

      return () => {
        handler.destroy()
        particlesRef.current?.destroy()
        particlesRef.current = null
        vawtMgrRef.current?.destroy()
        vawtMgrRef.current = null
        viewer.destroy()
        viewerRef.current = null
      }
    }, [])

    useEffect(() => {
      particlesRef.current?.updateWind(windSpeed, windDirection, gustEnabled)
    }, [windSpeed, windDirection, gustEnabled])

    useEffect(() => {
      particlesRef.current?.setCount(particleCount)
    }, [particleCount])

    useEffect(() => {
      particlesRef.current?.setRadius(particleRadius)
    }, [particleRadius])

    useEffect(() => {
      vawtMgrRef.current?.sync(vawts)
    }, [vawts])

    // Crosshair cursor + hide ghost when leaving placement mode
    useEffect(() => {
      if (containerRef.current)
        containerRef.current.style.cursor = placingMode ? 'crosshair' : ''
      if (!placingMode) vawtMgrRef.current?.hideCursor()
    }, [placingMode])

    return <div ref={containerRef} className="w-full h-full" />
  }
)

export default CesiumViewer
