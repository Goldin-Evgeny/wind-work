# Wind Simulation — Project Plan

> **How to use:** After each phase, mark it ✅ and fill in the "Result" field. Paste the Claude prompt template into a fresh Claude session with the current code state.

---

## Status Overview

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Project Setup | 🔄 In progress | Vite+React+TS scaffold exists, no Cesium yet |
| 1 | 3D Neighborhood Viewer | ⬜ | |
| 2 | UI Control Panel | ⬜ | |
| 3 | Wind & Air Flow Visualization | ⬜ | |
| 4 | Object Placement System | ⬜ | |
| 5 | Simple Wind Interaction | ⬜ | |
| 6 | Physics Integration (cannon-es) | ⬜ | |
| 7 | Smart Object Behaviors | ⬜ | |
| 8 | Extensibility for Other Users | ⬜ | |
| 9 | Polish, Performance & Sharing | ⬜ | |

---

## Claude Prompt Template (copy for every phase)

```
You are an expert full-stack 3D web developer specializing in Cesium.js + React + TypeScript.

Current project state: [PASTE src/App.tsx, vite.config.ts, package.json, and any new files from previous phase]

Now implement **Phase X: [Name]** exactly as described below. Do not add extra features.

Requirements:
- [copy the bullet list from the phase section below]
- Use only these libraries: [list from phase section]
- Output format: Show me the FULL updated files I need to replace/create (with filenames).
  Also give me exact terminal commands to run and how to test it.

After you output the code, I will test it locally and come back with feedback
or "Phase X successful — proceed to Phase Y".
```

---

## Phase 0: Project Setup

**Goal:** Clean Vite + React + TS + Cesium boilerplate (official recommended setup).

**Current state:** `wind-work/` already has Vite + React 19 + TS. Missing: Cesium, folder structure, Ion token.

**Requirements:**
- Integrate CesiumJS using the official `cesium-vite-example` structure
- Add Cesium Ion access token placeholder (env var `VITE_CESIUM_ION_TOKEN`)
- Tailwind CSS (v4) for future UI panels
- TypeScript strict mode (already on)
- Folder structure: `src/cesium/`, `src/components/`, `src/hooks/`
- `npm run dev` shows a blank Cesium viewer filling the screen

**Libraries:** `cesium`, `@cesium/engine`, `vite-plugin-cesium` (or manual copy-static approach)

**Test:** Browser shows a Cesium globe with no console errors.

**Result:** ⬜ _fill after testing_

---

## Phase 1: Basic 3D Neighborhood Viewer

**Goal:** Load a specific neighborhood + OSM 3D buildings + camera controls.

**Requirements:**
- Use `Cesium.createOsmBuildingsAsync()` for 3D buildings
- Set initial camera to a hardcoded lat/lon (your address — add it here once decided)
- Add Cesium World Terrain
- Add Bing or OSM imagery layer
- Smooth fly-in animation on load
- No UI yet — just the viewer

**Libraries:** `cesium` only

**Test:** Fly around your street with real 3D buildings extruded from OpenStreetMap.

**Result:** ⬜ _fill after testing_

---

## Phase 2: UI Control Panel

**Goal:** Sidebar with wind controls + address search.

**Requirements:**
- React sidebar (does not overlap map controls)
- Wind speed slider (0–30 m/s)
- Wind direction slider (0–360°) or compass rose
- Wind gust toggle
- Address search input (uses Cesium geocoder or Nominatim)
- State managed in React (Zustand or useState); passed down to Cesium layer via ref/hook
- Responsive layout (sidebar collapses on small screens)

**Libraries:** `cesium`, Tailwind, shadcn/ui (optional)

**Test:** Moving sliders updates displayed values. Address search flies camera to result.

**Result:** ⬜ _fill after testing_

---

## Phase 3: Wind & Air Flow Visualization

**Goal:** Real-time GPU-accelerated wind particles that flow around buildings.

**Requirements:**
- Integrate `cesium-wind-layer` (preferred) OR fork `3D-Wind-Field`
- Particles react to OSM buildings as obstacles
- Particle count, speed, color configurable from Phase 2 sliders
- Direction controlled by wind direction slider
- Turbulence visible near building edges

**Libraries:** `cesium`, `cesium-wind-layer` (or `3d-wind-field`)

**Test:** Thousands of particles streaming through neighborhood; changing wind direction rotates flow.

**Result:** ⬜ _fill after testing_

---

## Phase 4: Object Placement System

**Goal:** Click-to-place GLTF/GLB models on the map.

**Requirements:**
- Click on terrain/building → opens placement menu
- Load a simple `wind-turbine.glb` (low-poly, free from Sketchfab or KHR samples)
- Placed entity snaps to ground/roof surface
- List of placed objects in sidebar (with remove button)
- Objects persist through camera moves (Cesium Entity or Primitive)

**Libraries:** `cesium`, GLTF file via `public/models/`

**Test:** Click rooftop → turbine appears at correct geographic position; camera orbit doesn't move it.

**Result:** ⬜ _fill after testing_

---

## Phase 5: Simple Wind Interaction (no physics)

**Goal:** Each placed object samples local wind vector → visual reaction.

**Requirements:**
- Each object polls current wind speed + direction from Phase 2 state
- Turbine blades rotate; rotation speed ∝ wind speed
- Simple drag: object tilts slightly into wind direction
- Sampled every animation frame (Cesium `viewer.clock.onTick`)
- No real physics engine yet — pure transform manipulation

**Libraries:** `cesium`

**Test:** Turbine blades spin; increasing wind speed spins them faster.

**Result:** ⬜ _fill after testing_

---

## Phase 6: Physics Integration (cannon-es)

**Goal:** Add cannon-es physics world; sync with Cesium positions.

**Requirements:**
- `cannon-es` physics world running in parallel to render loop
- Each placed object has a corresponding `cannon-es` Body
- Cesium entity position/rotation updated from physics body each tick
- Wind applied as continuous `applyForce` on each body
- Objects collide with terrain (simplified flat plane is OK for now)
- Objects fall if dropped above terrain

**Libraries:** `cesium`, `cannon-es`

**Test:** Drop object above ground → it falls and lands. Wind blows lightweight object sideways.

**Result:** ⬜ _fill after testing_

---

## Phase 7: Smart Object Behaviors

**Goal:** Per-model behavior system with metadata JSON.

**Requirements:**
- `src/behaviors/` folder — one `.ts` file per behavior type
- `BehaviorMeta` interface: `{ dragCoefficient, mass, updateFn }`
- Bundled behaviors: `horizontal-turbine`, `vehicle`, `aircraft`
- Turbine: blade rotation + live power output (W) shown in sidebar
- Vehicle: steering controls + wind pushes it laterally
- JSON metadata sidecar per GLTF model (`wind-turbine.meta.json`)
- UI shows power output, drag force, current wind speed at object location

**Libraries:** `cesium`, `cannon-es`

**Test:** Drop turbine → see live kW readout update with wind slider.

**Result:** ⬜ _fill after testing_

---

## Phase 8: Extensibility for Other Users

**Goal:** Upload custom models + save/load scenarios.

**Requirements:**
- File input to upload custom `.glb` + optional `.meta.json`
- Scenario serialization: export entire scene to JSON (positions, models, wind settings)
- Import scenario JSON to restore state
- Shareable URL (encode compact JSON in URL hash or short link via backend)
- "Advanced" mode: sandboxed custom JS snippet per object (`new Function` with allow-list)

**Libraries:** `cesium`, `cannon-es`, optional: `lz-string` for URL compression

**Test:** Export scenario → reload page → import → identical scene restored.

**Result:** ⬜ _fill after testing_

---

## Phase 9: Polish, Performance & Sharing

**Goal:** Production-ready UX and deploy.

**Requirements:**
- FPS counter overlay
- Performance settings: particle count cap, LOD toggle, physics substep control
- Responsive UI (mobile: map full screen, bottom sheet for controls)
- Export simulation as video (canvas `captureStream` → MediaRecorder)
- Deploy to Vercel or Netlify with env var for Ion token
- README with setup instructions

**Libraries:** `cesium`, `cannon-es`, native `MediaRecorder` API

**Test:** Deployed URL loads on mobile. Video export produces playable file.

**Result:** ⬜ _fill after testing_

---

## Notes & Decisions

_Add any architectural decisions, gotchas, or deferred ideas here as the project progresses._

- **Neighborhood:** TBD — set lat/lon in Phase 1
- **Ion token:** Get free token at [cesium.com/ion](https://cesium.com/ion) before Phase 0
- **Turbine model:** Download before Phase 4 (search "wind turbine" on Sketchfab, filter CC0)
