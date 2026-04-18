# Wind Simulation — Project Plan

> **Product vision:** A 3D wind simulation tool for evaluating placement of **vertical-axis wind turbines (VAWTs)** in urban environments. VAWTs are compact, omnidirectional, and mountable on rooftops, balcony corners, and building edges — they thrive in the turbulent, swirling wind conditions created by urban geometry. This tool lets users explore real neighborhoods, visualize airflow around buildings, and identify optimal micro-siting spots for small VAWTs.

> **How to use:** After each phase, mark it ✅ and fill in the "Result" field.

---

## Status Overview

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Project Setup | ✅ | Cesium 1.140 + Tailwind v4 + vite-plugin-cesium |
| 1 | 3D Neighborhood Viewer | ✅ | OSM buildings, World Terrain, Bing imagery, fly-in to Haifa (32.763391, 34.964138) |
| 2 | UI Control Panel | ✅ | Wind speed/direction sliders, compass rose, gust toggle, Nominatim search |
| 3 | Wind & Air Flow Visualization | 🔄 | 25k particle system with building deflection via height grid |
| 4 | VAWT Placement System | ⬜ | |
| 5 | VAWT Wind Response | ⬜ | |
| 6 | Physics Integration (cannon-es) | ⬜ | |
| 7 | Smart VAWT Behaviors | ⬜ | |
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

## Phase 4: VAWT Placement System

**Goal:** Click-to-place vertical-axis wind turbine (VAWT) models on any surface.

**Context:** VAWTs are small, cylindrical turbines that spin around a vertical axis. They work with wind from any direction and are designed for urban micro-siting: rooftops, balcony railings, building corners, and parapet edges. They do NOT need to face the wind.

**Requirements:**
- Click on terrain, rooftop, or building facade → places a VAWT model at that point
- Placement snaps to the clicked surface normal (roof = vertical mount, wall = horizontal arm mount)
- VAWT model: low-poly Savonius or Darrieus rotor GLB in `public/models/vawt.glb`
- Support two placement modes: **Rooftop** (vertical pole) and **Balcony corner** (corner bracket mount)
- List of placed VAWTs in sidebar with label, location, and remove button
- VAWTs persist through camera moves

**Libraries:** `cesium`, GLTF file via `public/models/`

**Test:** Click a rooftop → VAWT appears upright at that position. Click a building corner → VAWT appears mounted at corner height.

**Result:** ⬜ _fill after testing_

---

## Phase 5: VAWT Wind Response (no physics)

**Goal:** Each placed VAWT visually reacts to local wind; sidebar shows estimated power output.

**Context:** VAWTs respond to wind from any horizontal direction — the rotor spins around its vertical axis regardless of where the wind comes from. Power output scales roughly with the cube of wind speed: P ∝ v³. Urban placement near building corners and edges often benefits from wind acceleration (Venturi effect).

**Requirements:**
- Each VAWT rotor spins continuously; rotation speed ∝ local wind speed
- Local wind speed at each VAWT samples from the particle flow field (position in height grid)
- Building corner / rooftop edge VAWTs get a +10–30% Venturi boost multiplier
- Sidebar shows per-VAWT estimated power output in Watts (simplified P = 0.5 × Cp × ρ × A × v³, Cp=0.35)
- VAWTs in wind shadow (downwind of buildings) show reduced speed and power
- No physics engine yet — pure transform rotation

**Libraries:** `cesium`

**Test:** VAWT spins; increasing wind speed spins it faster and raises power readout. A VAWT behind a building shows lower output than one on an exposed corner.

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

## Phase 7: Smart VAWT Behaviors

**Goal:** Per-VAWT behavior system with metadata + site quality scoring.

**Requirements:**
- `src/behaviors/` folder — one `.ts` file per VAWT type
- `VAWTMeta` interface: `{ rotorDiameter, rotorHeight, Cp, mass, mountType }`
- Bundled types: `savonius-small` (balcony, ~0.5m dia), `darrieus-rooftop` (1–2m dia), `helical-corner` (corner mount)
- Each type has correct rotor geometry and power curve
- Site quality score (0–100) shown per VAWT: factors in avg wind speed, turbulence index, Venturi boost, shadow penalty
- JSON metadata sidecar per GLB (`vawt-savonius.meta.json`)
- Sidebar shows: power (W), site score, wind speed at rotor, turbulence level

**Libraries:** `cesium`, `cannon-es`

**Test:** Place two VAWTs — one on exposed corner, one in wind shadow. Corner VAWT scores higher and shows higher power output.

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

- **Turbine type:** Vertical-axis wind turbines (VAWTs) only — Savonius and Darrieus designs. VAWTs are omnidirectional (no yaw needed), low-noise, and suited for turbulent urban wind. They are small enough for balcony corners and rooftop parapets.
- **Neighborhood:** Haifa, Israel — lat 32.763391, lon 34.964138
- **Ion token:** stored in `.env` as `VITE_CESIUM_ION_TOKEN`
- **Wind simulation approach:** Particle advection (Phase 3) with height-grid building deflection. A Lattice-Boltzmann 2D slice is the right long-term approach for realistic wake/vortex modeling around buildings — consider for Phase 7 site scoring.
- **Cesium version:** 1.140 — use `baseLayer` not deprecated `imageryProvider`; `sceneModePicker: false` required (OSM buildings crash in 2D mode)
- **Tailwind v4 gotcha:** bare `* { padding: 0 }` outside any layer overrides utility classes — do not add global resets after `@import "tailwindcss"`
- **VAWT model:** Need GLB before Phase 4. Options: create simple procedural mesh in code, or source CC0 Savonius model.
