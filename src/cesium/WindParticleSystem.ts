import * as Cesium from 'cesium'

const MAX_N = 12000
const MAX_H = 120
const SPEED_SCALE = 55
const GRID_RES = 64
const TRAIL_LEN = 10

const C_SHADOW  = new Cesium.Color(0.28, 0.38, 0.98, 0.55)
const C_ROOFTOP = new Cesium.Color(1.00, 0.97, 0.20, 1.00)
const C_OPEN    = new Cesium.Color(1.00, 0.52, 0.08, 0.80)
const C_DEFAULT = new Cesium.Color(1.00, 0.65, 0.15, 0.65)

export class WindParticleSystem {
  private viewer: Cesium.Viewer
  private lines: Cesium.PolylineCollection
  private center: Cesium.Cartesian3

  private eVec: Cesium.Cartesian3
  private nVec: Cesium.Cartesian3
  private uVec: Cesium.Cartesian3

  private speed = 0
  private dirRad = 0
  private gust = false
  private windUnit = new Cesium.Cartesian3()

  private radius = 300
  private activeN = MAX_N

  private heightGrid: Float32Array | null = null
  private gridReady = false
  private gridRadius = 0  // radius used when grid was last sampled

  private posArrays: Cesium.Cartesian3[][]

  private removePostRender: () => void
  private t0 = 0

  constructor(viewer: Cesium.Viewer, center: Cesium.Cartesian3) {
    this.viewer = viewer
    this.center = center.clone()

    const m = Cesium.Transforms.eastNorthUpToFixedFrame(center)
    this.eVec = new Cesium.Cartesian3(m[0], m[1], m[2])
    this.nVec = new Cesium.Cartesian3(m[4], m[5], m[6])
    this.uVec = new Cesium.Cartesian3(m[8], m[9], m[10])

    this.posArrays = Array.from({ length: MAX_N }, () =>
      Array.from({ length: TRAIL_LEN }, () => new Cesium.Cartesian3())
    )

    this.lines = viewer.scene.primitives.add(new Cesium.PolylineCollection())

    for (let i = 0; i < MAX_N; i++) {
      const seed = this.randomPos()
      const positions = this.posArrays[i]
      for (let j = 0; j < TRAIL_LEN; j++) {
        positions[j].x = seed.x
        positions[j].y = seed.y
        positions[j].z = seed.z
      }
      this.lines.add({
        positions,
        width: 2,
        material: Cesium.Material.fromType('PolylineGlow', {
          glowPower: 0.25,
          color: C_DEFAULT.clone(),
        }),
        arcType: Cesium.ArcType.NONE,
      })
    }

    this.t0 = performance.now()
    this.removePostRender = viewer.scene.postRender.addEventListener(() => {
      const now = performance.now()
      const dt = Math.min((now - this.t0) / 1000, 0.05)
      this.t0 = now
      this.tick(dt)
    })

    setTimeout(() => this.initHeightGrid(), 4000)
  }

  // ── height grid ───────────────────────────────────────────────────────────

  private async initHeightGrid() {
    if (this.viewer.isDestroyed()) return
    const r = this.radius
    const step = (r * 2) / GRID_RES
    const cartos: Cesium.Cartographic[] = []

    for (let i = 0; i < GRID_RES; i++) {
      for (let j = 0; j < GRID_RES; j++) {
        const e = -r + i * step
        const n = -r + j * step
        cartos.push(Cesium.Cartographic.fromCartesian(this.enuToEcef(e, n, 0)))
      }
    }

    try {
      const results = await this.viewer.scene.sampleHeightMostDetailed(cartos)
      const grid = new Float32Array(GRID_RES * GRID_RES)
      for (let k = 0; k < results.length; k++) grid[k] = results[k].height ?? 0
      this.heightGrid = grid
      this.gridRadius = r
      this.gridReady = true
    } catch {
      // Height sampling unavailable
    }
  }

  private heightAt(enu_e: number, enu_n: number): number {
    if (!this.gridReady || !this.heightGrid) return 0
    const r = this.gridRadius
    const step = (r * 2) / GRID_RES
    const fi = (enu_e + r) / step
    const fj = (enu_n + r) / step
    const i0 = Math.max(0, Math.min(GRID_RES - 2, Math.floor(fi)))
    const j0 = Math.max(0, Math.min(GRID_RES - 2, Math.floor(fj)))
    const tf = fi - i0, tg = fj - j0
    const g = this.heightGrid
    return (
      g[i0 * GRID_RES + j0]           * (1 - tf) * (1 - tg) +
      g[(i0 + 1) * GRID_RES + j0]     * tf        * (1 - tg) +
      g[i0 * GRID_RES + (j0 + 1)]     * (1 - tf)  * tg +
      g[(i0 + 1) * GRID_RES + (j0 + 1)] * tf      * tg
    )
  }

  // ── position helpers ──────────────────────────────────────────────────────

  private enuToEcef(e: number, n: number, u: number): Cesium.Cartesian3 {
    return new Cesium.Cartesian3(
      this.center.x + e * this.eVec.x + n * this.nVec.x + u * this.uVec.x,
      this.center.y + e * this.eVec.y + n * this.nVec.y + u * this.uVec.y,
      this.center.z + e * this.eVec.z + n * this.nVec.z + u * this.uVec.z,
    )
  }

  private randomPos(): Cesium.Cartesian3 {
    const angle = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random()) * this.radius
    return this.enuToEcef(Math.cos(angle) * r, Math.sin(angle) * r, Math.random() * MAX_H)
  }

  private respawnPos(): Cesium.Cartesian3 {
    const sinD = Math.sin(this.dirRad)
    const cosD = Math.cos(this.dirRad)
    const t = (Math.random() - 0.5) * 2 * this.radius
    return this.enuToEcef(
      -sinD * this.radius + cosD * t,
      -cosD * this.radius - sinD * t,
      Math.random() * MAX_H,
    )
  }

  private recomputeWindUnit() {
    const sinD = Math.sin(this.dirRad)
    const cosD = Math.cos(this.dirRad)
    this.windUnit.x = sinD * this.eVec.x + cosD * this.nVec.x
    this.windUnit.y = sinD * this.eVec.y + cosD * this.nVec.y
    this.windUnit.z = sinD * this.eVec.z + cosD * this.nVec.z
  }

  private zoneColor(enuU: number, surfaceH: number): Cesium.Color {
    const rel = enuU - surfaceH
    if (rel < -2) return C_SHADOW
    if (rel < 8)  return C_ROOFTOP
    return C_OPEN
  }

  // ── main tick ─────────────────────────────────────────────────────────────

  private tick(dt: number) {
    if (this.speed < 0.05) return

    const gustMult = this.gust ? 0.6 + Math.random() * 0.9 : 1.0
    const s = this.speed * SPEED_SCALE * gustMult * dt

    const dx = this.windUnit.x * s
    const dy = this.windUnit.y * s
    const dz = this.windUnit.z * s

    const cx = this.center.x, cy = this.center.y, cz = this.center.z
    const exitDistSq = this.radius * this.radius * 2.25

    for (let i = 0; i < this.activeN; i++) {
      const positions = this.posArrays[i]
      const head = positions[TRAIL_LEN - 1]

      let nx = head.x + dx
      let ny = head.y + dy
      let nz = head.z + dz

      const ex = nx - cx, ey = ny - cy, ez = nz - cz

      if (ex * ex + ey * ey + ez * ez > exitDistSq) {
        const seed = this.respawnPos()
        for (let j = 0; j < TRAIL_LEN; j++) {
          positions[j].x = seed.x; positions[j].y = seed.y; positions[j].z = seed.z
        }
        this.lines.get(i).positions = positions
        continue
      }

      const enuE = ex * this.eVec.x + ey * this.eVec.y + ez * this.eVec.z
      const enuN = ex * this.nVec.x + ey * this.nVec.y + ez * this.nVec.z
      const enuU = ex * this.uVec.x + ey * this.uVec.y + ez * this.uVec.z

      if (this.gridReady) {
        const surfaceH = this.heightAt(enuE, enuN)

        if (enuU < surfaceH + 1.5) {
          const lift = surfaceH + 1.5 + Math.random() * 5
          const swirl = (Math.random() - 0.5) * s * 3.5
          const swirlE = Math.cos(this.dirRad) * swirl
          const swirlN = -Math.sin(this.dirRad) * swirl
          nx = cx + (enuE + swirlE) * this.eVec.x + (enuN + swirlN) * this.nVec.x + lift * this.uVec.x
          ny = cy + (enuE + swirlE) * this.eVec.y + (enuN + swirlN) * this.nVec.y + lift * this.uVec.y
          nz = cz + (enuE + swirlE) * this.eVec.z + (enuN + swirlN) * this.nVec.z + lift * this.uVec.z
        }

        this.lines.get(i).material.uniforms.color = this.zoneColor(enuU, surfaceH)
      }

      for (let j = 0; j < TRAIL_LEN - 1; j++) {
        const a = positions[j], b = positions[j + 1]
        a.x = b.x; a.y = b.y; a.z = b.z
      }
      head.x = nx; head.y = ny; head.z = nz

      this.lines.get(i).positions = positions
    }

    if (this.gust && this.speed > 1) {
      const count = Math.floor(this.activeN * 0.02)
      const jAmt = this.speed * SPEED_SCALE * 0.3 * dt
      for (let k = 0; k < count; k++) {
        const i = Math.floor(Math.random() * this.activeN)
        const head = this.posArrays[i][TRAIL_LEN - 1]
        head.x += (Math.random() - 0.5) * jAmt * this.eVec.x
        head.y += (Math.random() - 0.5) * jAmt * this.eVec.y
        head.z += (Math.random() - 0.5) * jAmt * 0.3 * this.uVec.z
        this.lines.get(i).positions = this.posArrays[i]
      }
    }
  }

  // ── public API ────────────────────────────────────────────────────────────

  updateWind(speed: number, direction: number, gustEnabled: boolean) {
    this.speed = speed
    this.dirRad = Cesium.Math.toRadians(direction)
    this.gust = gustEnabled
    this.recomputeWindUnit()

    if (!this.gridReady) {
      const t = Math.min(speed / 30, 1)
      const col = new Cesium.Color(1.0, 0.82 - t * 0.62, 0.18 - t * 0.15, 0.35 + t * 0.50)
      for (let i = 0; i < this.activeN; i++) this.lines.get(i).material.uniforms.color = col
    }
  }

  setCount(n: number) {
    const next = Math.max(100, Math.min(MAX_N, n))
    for (let i = 0; i < MAX_N; i++) this.lines.get(i).show = i < next
    this.activeN = next
  }

  setRadius(r: number) {
    this.radius = r
    // Respawn all particles within the new radius
    for (let i = 0; i < MAX_N; i++) {
      const seed = this.randomPos()
      const positions = this.posArrays[i]
      for (let j = 0; j < TRAIL_LEN; j++) {
        positions[j].x = seed.x; positions[j].y = seed.y; positions[j].z = seed.z
      }
      this.lines.get(i).positions = positions
    }
    // Re-sample building heights for new area
    this.gridReady = false
    this.heightGrid = null
    this.initHeightGrid()
  }

  destroy() {
    this.removePostRender()
    this.viewer.scene.primitives.remove(this.lines)
  }
}
