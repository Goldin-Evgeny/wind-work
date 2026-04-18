import * as Cesium from 'cesium'
import type { PlacedVAWT } from '../hooks/useVAWTState'

const POLE_H = 2.0
const ROTOR_H = 1.4
const ROTOR_R = 0.35

function offsetUp(pos: Cesium.Cartesian3, meters: number): Cesium.Cartesian3 {
  const c = Cesium.Cartographic.fromCartesian(pos)
  return Cesium.Cartesian3.fromRadians(c.longitude, c.latitude, c.height + meters)
}

function makePole(viewer: Cesium.Viewer, pos: Cesium.Cartesian3, color: Cesium.Color): Cesium.Entity {
  return viewer.entities.add({
    position: offsetUp(pos, POLE_H / 2),
    cylinder: {
      length: POLE_H,
      topRadius: 0.05,
      bottomRadius: 0.05,
      material: color,
    },
  })
}

function makeRotor(
  viewer: Cesium.Viewer,
  pos: Cesium.Cartesian3,
  fill: Cesium.Color,
  outline: Cesium.Color,
  label?: string,
): Cesium.Entity {
  return viewer.entities.add({
    position: offsetUp(pos, POLE_H - ROTOR_H / 2 + 0.1),
    cylinder: {
      length: ROTOR_H,
      topRadius: ROTOR_R,
      bottomRadius: ROTOR_R,
      material: fill,
      outline: true,
      outlineColor: outline,
    },
    ...(label ? {
      label: {
        text: label,
        font: '11px monospace',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -24),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    } : {}),
  })
}

export class VAWTManager {
  private viewer: Cesium.Viewer
  private placed = new Map<string, Cesium.Entity[]>()
  private cursor: Cesium.Entity[] = []
  private cursorVisible = false

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
    this.initCursor()
  }

  private initCursor() {
    this.cursor = [
      this.viewer.entities.add({
        show: false,
        cylinder: {
          length: POLE_H,
          topRadius: 0.05,
          bottomRadius: 0.05,
          material: Cesium.Color.CYAN.withAlpha(0.6),
        },
      }),
      this.viewer.entities.add({
        show: false,
        cylinder: {
          length: ROTOR_H,
          topRadius: ROTOR_R,
          bottomRadius: ROTOR_R,
          material: Cesium.Color.CYAN.withAlpha(0.3),
          outline: true,
          outlineColor: Cesium.Color.CYAN,
        },
        label: {
          text: 'Click to place',
          font: '11px monospace',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -24),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      }),
    ]
  }

  setCursor(pos: Cesium.Cartesian3) {
    this.cursor[0].position = new Cesium.ConstantPositionProperty(offsetUp(pos, POLE_H / 2))
    this.cursor[1].position = new Cesium.ConstantPositionProperty(offsetUp(pos, POLE_H - ROTOR_H / 2 + 0.1))
    if (!this.cursorVisible) {
      this.cursor.forEach(e => (e.show = true))
      this.cursorVisible = true
    }
  }

  hideCursor() {
    if (this.cursorVisible) {
      this.cursor.forEach(e => (e.show = false))
      this.cursorVisible = false
    }
  }

  sync(vawts: PlacedVAWT[]) {
    const live = new Set(vawts.map(v => v.id))

    for (const [id, ents] of this.placed) {
      if (!live.has(id)) {
        ents.forEach(e => this.viewer.entities.remove(e))
        this.placed.delete(id)
      }
    }

    for (const vawt of vawts) {
      if (!this.placed.has(vawt.id)) {
        this.placed.set(vawt.id, [
          makePole(this.viewer, vawt.position, Cesium.Color.fromCssColorString('#556')),
          makeRotor(
            this.viewer, vawt.position,
            Cesium.Color.fromCssColorString('#88c').withAlpha(0.85),
            Cesium.Color.fromCssColorString('#aaf'),
            vawt.label,
          ),
        ])
      }
    }
  }

  destroy() {
    this.hideCursor()
    this.cursor.forEach(e => this.viewer.entities.remove(e))
    for (const ents of this.placed.values()) ents.forEach(e => this.viewer.entities.remove(e))
    this.placed.clear()
  }
}
