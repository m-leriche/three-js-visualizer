# Ring Stack Visualizer — POC

A 3D sandbox showing how two gold diamond rings stack when worn on a finger.
Built with **React + TypeScript + Three.js** (via `@react-three/fiber`).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

## What it does

- Two gold rings of slightly different style on one finger:
  - **Solitaire** — single raised brilliant-cut stone in a 4-prong setting
  - **Pavé band** — a tapered row of small stones across the front
- Orbit with the mouse (drag to rotate, scroll to zoom).
- Live control panel (top-right) to:
  - switch gold tone — **yellow / rose / white**
  - adjust the **stack gap** between the two rings
  - **swap** which ring sits on top
  - toggle the **finger** and **auto-rotate**

## How it's put together

| File | Role |
|------|------|
| `src/App.tsx` | Canvas, HUD, and the Leva control panel |
| `src/components/Scene.tsx` | Lighting, custom studio environment, ring placement, camera controls |
| `src/components/Ring.tsx` | Parametric gold band + setting; `solitaire` and `pave` styles |
| `src/components/Gem.tsx` | Faceted brilliant-cut diamond (lathed profile, physical/transmissive material) |
| `src/components/Finger.tsx` | Stylised finger the rings stack on |

### Notes for extending

- **Diamonds** use `MeshPhysicalMaterial` with `transmission` + `ior: 2.42` (diamond's real
  refractive index) and flat shading for crisp facets. The sparkle comes from the custom
  `<Environment>` built from `<Lightformer>`s — no external HDR downloads, so it works offline.
- **Gold** is `MeshStandardMaterial` with `metalness: 1` and a low roughness; tones are just
  color swaps in `Scene.tsx`.
- The band is a torus sized to the finger radius; stones sit on the front (+Z) arc.
- To load real CAD/jewelry models instead of the parametric geometry, swap a ring for a
  `useGLTF()` load from drei — the rest of the scene stays the same.
