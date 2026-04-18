import { useState } from 'react'
import type { WindState } from '../hooks/useWindState'
import type { PlacedVAWT, MountType } from '../hooks/useVAWTState'

interface Props {
  wind: WindState & {
    setSpeed: (v: number) => void
    setDirection: (v: number) => void
    setGustEnabled: (v: boolean) => void
  }
  onFlyTo: (lon: number, lat: number) => void
  particleCount: number
  setParticleCount: (v: number) => void
  particleRadius: number
  setParticleRadius: (v: number) => void
  vawt: {
    placingMode: boolean
    setPlacingMode: (v: boolean) => void
    mountType: MountType
    setMountType: (v: MountType) => void
    vawts: PlacedVAWT[]
    removeVAWT: (id: string) => void
  }
}

const BEARINGS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const bearing = (deg: number) => BEARINGS[Math.round(deg / 45) % 8]

function DirectionArrow({ deg }: { deg: number }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" fill="#1f2937" stroke="#374151" strokeWidth="1.5" />
      {['N', 'E', 'S', 'W'].map((label, i) => {
        const rad = (i * 90 - 90) * Math.PI / 180
        return (
          <text key={label} x={24 + 16 * Math.cos(rad)} y={24 + 16 * Math.sin(rad)}
            textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#6b7280" fontFamily="monospace">
            {label}
          </text>
        )
      })}
      <g transform={`rotate(${deg}, 24, 24)`}>
        <polygon points="24,6 27,22 24,20 21,22" fill="#3b82f6" />
        <polygon points="24,42 27,26 24,28 21,26" fill="#374151" />
      </g>
    </svg>
  )
}

function Divider() {
  return <div className="border-t border-gray-700" />
}

export default function WindPanel({ wind, onFlyTo, particleCount, setParticleCount, particleRadius, setParticleRadius, vawt }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  async function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSearchError('')
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (!data.length) setSearchError('Location not found')
      else { onFlyTo(parseFloat(data[0].lon), parseFloat(data[0].lat)); setSearchError('') }
    } catch {
      setSearchError('Search failed')
    } finally {
      setSearching(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{ background: 'rgba(17,24,39,0.95)' }}
        className="absolute top-4 left-4 z-20 text-white w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors shadow-xl border border-gray-700 text-base"
        aria-label={collapsed ? 'Open panel' : 'Close panel'}
      >
        {collapsed ? '☰' : '✕'}
      </button>

      {!collapsed && (
        <div
          style={{ background: 'rgba(17,24,39,0.97)', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}
          className="absolute top-4 left-14 z-20 w-72 text-white rounded-2xl shadow-2xl border border-gray-700"
        >
          <div className="px-5 py-4 border-b border-gray-700">
            <h2 className="text-sm font-semibold tracking-wide text-white">Wind Simulator</h2>
          </div>

          <div className="px-5 py-4 flex flex-col gap-5">

            {/* Location search */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Location</label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search address…"
                  className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                  style={{ background: '#111827' }}
                />
                <button type="submit" disabled={searching}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap">
                  {searching ? '…' : 'Go'}
                </button>
              </form>
              {searchError && <p className="text-xs text-red-400">{searchError}</p>}
            </div>

            <Divider />

            {/* Direction */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Direction</label>
                <span className="text-lg font-bold tabular-nums">
                  {wind.direction}° <span className="text-blue-400 text-sm">{bearing(wind.direction)}</span>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <DirectionArrow deg={wind.direction} />
                <input type="range" min={0} max={359} step={1} value={wind.direction}
                  onChange={e => wind.setDirection(parseInt(e.target.value))}
                  className="flex-1 h-2 rounded-full cursor-pointer accent-blue-500" />
              </div>
            </div>

            <Divider />

            {/* Speed */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Wind Speed</label>
                <span className="text-lg font-bold tabular-nums">
                  {wind.speed.toFixed(1)} <span className="text-blue-400 text-sm">m/s</span>
                </span>
              </div>
              <input type="range" min={0} max={30} step={0.5} value={wind.speed}
                onChange={e => wind.setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer accent-blue-500" />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>Calm</span><span>Breeze</span><span>Strong</span><span>Gale</span>
              </div>
            </div>

            <Divider />

            {/* Gusts */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Gusts</p>
                <p className="text-xs text-gray-500 mt-0.5">Turbulent bursts</p>
              </div>
              <button onClick={() => wind.setGustEnabled(!wind.gustEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 border ${wind.gustEnabled ? 'bg-blue-600 border-blue-500' : 'bg-gray-700 border-gray-600'}`}
                role="switch" aria-checked={wind.gustEnabled}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${wind.gustEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <Divider />

            {/* Particle count */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Particles</label>
                <span className="text-lg font-bold tabular-nums">
                  {particleCount.toLocaleString()} <span className="text-blue-400 text-sm">lines</span>
                </span>
              </div>
              <input type="range" min={500} max={12000} step={500} value={particleCount}
                onChange={e => setParticleCount(parseInt(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer accent-blue-500" />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>Sparse</span><span>Default</span><span>Dense</span>
              </div>
            </div>

            {/* Radius */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Radius</label>
                <span className="text-lg font-bold tabular-nums">
                  {particleRadius} <span className="text-blue-400 text-sm">m</span>
                </span>
              </div>
              <input type="range" min={100} max={800} step={50} value={particleRadius}
                onChange={e => setParticleRadius(parseInt(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer accent-blue-500" />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>100m</span><span>400m</span><span>800m</span>
              </div>
            </div>

            <Divider />

            {/* VAWT placement */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Turbines</label>

              {/* Mount type */}
              <div className="flex gap-2">
                {(['rooftop', 'corner'] as MountType[]).map(type => (
                  <button key={type}
                    onClick={() => vawt.setMountType(type)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${vawt.mountType === type ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'}`}>
                    {type}
                  </button>
                ))}
              </div>

              {/* Place button */}
              <button
                onClick={() => vawt.setPlacingMode(!vawt.placingMode)}
                className={`w-full py-2 rounded-lg text-sm font-medium border transition-colors ${vawt.placingMode ? 'bg-cyan-600 border-cyan-500 text-white animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'}`}>
                {vawt.placingMode ? '⊕ Click map to place…' : '+ Place VAWT'}
              </button>

              {/* Placed list */}
              {vawt.vawts.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  {vawt.vawts.map(v => (
                    <div key={v.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
                      <div>
                        <p className="text-xs font-medium text-white">{v.label}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{v.mountType}</p>
                      </div>
                      <button onClick={() => vawt.removeVAWT(v.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors text-sm ml-2">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  )
}
