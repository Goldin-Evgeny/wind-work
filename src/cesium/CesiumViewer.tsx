import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN

const HOME = { lon: 34.964138, lat: 32.763391 }

export default function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    const viewer = new Cesium.Viewer(containerRef.current, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      infoBox: false,
      selectionIndicator: false,
      baseLayerPicker: false,
      sceneModePicker: false,
    })
    viewerRef.current = viewer

    Cesium.createOsmBuildingsAsync().then((osmBuildings) => {
      if (!viewer.isDestroyed()) {
        viewer.scene.primitives.add(osmBuildings)
      }
    })

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(HOME.lon, HOME.lat, 600),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 3,
    })

    return () => {
      viewer.destroy()
      viewerRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
