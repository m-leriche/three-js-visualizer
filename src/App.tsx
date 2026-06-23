import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { useControls, folder } from 'leva'
import {
  Scene,
  type GoldTone,
  type Slot,
  type GravityMode,
  type HandPlacement,
} from './components/Scene'
import type { RingStyle } from './components/Ring'
import './App.css'

// Catalog of ring designs available in each slot's dropdown.
const DESIGN_OPTIONS: Record<string, RingStyle | 'none'> = {
  None: 'none',
  'Asymmetric · Garnet (red)': 'asym-garnet',
  'Asymmetric · Emerald (green)': 'asym-emerald',
  'Asymmetric · Topaz (blue)': 'asym-topaz',
  'Asymmetric · Diamond bar': 'asym-diamonds',
  Solitaire: 'solitaire',
  'Pavé band': 'pave',
}

export default function App() {
  const {
    gold,
    gap,
    gravity,
    showFinger,
    handView,
    autoRotate,
    hScale,
    hx,
    hy,
    hz,
    hTiltX,
    hTiltZ,
    hSpin,
    hRingScale,
    hGap,
    design1,
    flip1,
    turn1,
    design2,
    flip2,
    turn2,
    design3,
    flip3,
    turn3,
    design4,
    flip4,
    turn4,
  } = useControls({
    Scene: folder({
      gold: { value: 'yellow' as GoldTone, options: ['yellow', 'rose', 'white'] },
      gap: { value: 0.55, min: 0.1, max: 2.5, step: 0.01, label: 'stack gap' },
      gravity: {
        value: 'off',
        options: { Off: 'off', 'Floor (pile)': 'floor', 'Finger (slide down)': 'finger' },
        label: 'gravity',
      },
      showFinger: { value: true, label: 'show finger' },
      handView: { value: true, label: 'hand view' },
      autoRotate: { value: false, label: 'auto-rotate' },
    }),
    // Placement of the ring stack on the realistic hand. The scan is a relaxed
    // curl with no straight finger, so the stack is positioned/tilted by hand.
    'Hand (ring placement)': folder(
      {
        hScale: { value: 0.24, min: 0.1, max: 0.5, step: 0.005, label: 'hand scale' },
        hx: { value: -0.4, min: -1.2, max: 1.2, step: 0.001, label: 'stack x' },
        hy: { value: 4.39, min: 2, max: 5, step: 0.01, label: 'stack y' },
        hz: { value: 0.37, min: -1, max: 1.5, step: 0.01, label: 'stack z' },
        hTiltX: { value: 13, min: -90, max: 90, step: 1, label: 'tilt x°' },
        hTiltZ: { value: 0, min: -45, max: 45, step: 1, label: 'tilt z°' },
        hSpin: { value: -180, min: -180, max: 180, step: 1, label: 'spin°' },
        hRingScale: { value: 0.25, min: 0.1, max: 0.5, step: 0.005, label: 'ring scale' },
        hGap: { value: 0.24, min: 0.1, max: 0.8, step: 0.01, label: 'ring gap' },
      },
      { collapsed: true },
    ),
    'Ring 1': folder({
      design1: { value: 'asym-garnet' as RingStyle | 'none', options: DESIGN_OPTIONS, label: 'design' },
      flip1: { value: true, label: 'flip' },
      turn1: { value: 0, min: 0, max: 360, step: 1, label: 'turn°' },
    }),
    'Ring 2': folder({
      design2: { value: 'asym-emerald' as RingStyle | 'none', options: DESIGN_OPTIONS, label: 'design' },
      flip2: { value: false, label: 'flip' },
      turn2: { value: 0, min: 0, max: 360, step: 1, label: 'turn°' },
    }),
    'Ring 3': folder({
      design3: { value: 'asym-diamonds' as RingStyle | 'none', options: DESIGN_OPTIONS, label: 'design' },
      flip3: { value: false, label: 'flip' },
      turn3: { value: 0, min: 0, max: 360, step: 1, label: 'turn°' },
    }),
    'Ring 4': folder({
      design4: { value: 'asym-topaz' as RingStyle | 'none', options: DESIGN_OPTIONS, label: 'design' },
      flip4: { value: true, label: 'flip' },
      turn4: { value: 0, min: 0, max: 360, step: 1, label: 'turn°' },
    }),
  })

  const slots: Slot[] = [
    { style: design1, flip: flip1, turn: turn1 },
    { style: design2, flip: flip2, turn: turn2 },
    { style: design3, flip: flip3, turn: turn3 },
    { style: design4, flip: flip4, turn: turn4 },
  ]

  // Screenshot/dev overrides: ?solo=<style> isolates one ring; ?shot freezes it;
  // ?cam=x,y,z and ?tgt=x,y,z frame the camera.
  const params = new URLSearchParams(window.location.search)
  const solo = params.get('solo')
  const shot = params.has('shot')
  const parseVec = (s: string | null) =>
    s ? (s.split(',').map(Number) as [number, number, number]) : null
  const camPos = parseVec(params.get('cam')) ?? ([3.5, 1.5, 6] as [number, number, number])
  const target = parseVec(params.get('tgt')) ?? undefined
  const effectiveSlots: Slot[] = solo
    ? [{ style: solo as RingStyle, flip: false, turn: 0 }]
    : slots
  const effectiveGravity: GravityMode = params.has('finger')
    ? 'finger'
    : params.has('physics')
      ? 'floor'
      : (gravity as GravityMode)

  // Hand-placement values come from the leva sliders, but a matching URL param
  // (?hx=, ?hSpin=, …) overrides for framed screenshots / sharing a setup.
  const hp = (key: string, fallback: number) =>
    params.has(key) ? Number(params.get(key)) : fallback
  const handPlacement: HandPlacement = {
    scale: hp('hScale', hScale),
    pos: [hp('hx', hx), hp('hy', hy), hp('hz', hz)],
    tilt: [(hp('hTiltX', hTiltX) * Math.PI) / 180, 0, (hp('hTiltZ', hTiltZ) * Math.PI) / 180],
    spin: (hp('hSpin', hSpin) * Math.PI) / 180,
    ringScale: hp('hRingScale', hRingScale),
    gap: hp('hGap', hGap),
  }
  // ?handview forces the hand on for framed screenshots.
  const effectiveHandView = params.has('handview') || handView

  return (
    <div className="app">
      {/* Store-interior backdrop behind the transparent canvas, with a haze veil. */}
      <div className="bg" />
      <div className="haze" />

      <header className="hud">
        <h1>Ring Stack Visualizer</h1>
        <p>Pick up to 3 rings — drag to orbit, scroll to zoom, choose designs in the panel ↗</p>
      </header>

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: camPos, fov: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
          outputColorSpace: SRGBColorSpace,
        }}
      >
        <Suspense fallback={null}>
          <Scene
            gold={gold as GoldTone}
            gap={gap}
            slots={effectiveSlots}
            gravity={effectiveGravity}
            showFinger={shot ? false : showFinger}
            handView={effectiveHandView}
            handPlacement={handPlacement}
            autoRotate={shot ? false : autoRotate}
            target={target}
          />
        </Suspense>
      </Canvas>

      <footer className="legend">
        <span><b>Garnet</b> · red square + accent</span>
        <span><b>Emerald</b> · green rectangular + accent</span>
        <span><b>Diamond bar</b> · 10 stones</span>
      </footer>
    </div>
  )
}
