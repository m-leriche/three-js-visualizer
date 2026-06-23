import { useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Gem } from './Gem'

export type RingStyle =
  | 'solitaire'
  | 'pave'
  | 'asym-garnet'
  | 'asym-emerald'
  | 'asym-topaz'
  | 'asym-diamonds'

type AsymVariant = 'garnet' | 'emerald' | 'topaz' | 'diamonds'

type RingProps = {
  /** Inner radius of the band — should match the finger radius. */
  bandRadius?: number
  /** Thickness of the band tube. */
  tubeRadius?: number
  /** Gold tone for the metal. */
  goldColor?: THREE.ColorRepresentation
  /** Ring design. */
  style?: RingStyle
  /** Mirror the asymmetric stone layout to the other side. */
  flip?: boolean
} & ThreeElements['group']

/**
 * A gold band with diamonds. The band is a torus lying flat (hole pointing up
 * the Y axis) so a vertical finger passes through it. The front of the ring
 * (+Z) carries the stones so they face the camera.
 */
export function Ring({
  bandRadius = 1,
  tubeRadius = 0.12,
  goldColor = '#e6b54a',
  style = 'solitaire',
  flip = false,
  ...group
}: RingProps) {
  // Polished-gold setup mirrored from the nameplate-necklace POC: physical
  // material with a clearcoat, low roughness, and a strong env reflection.
  const goldMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: goldColor,
        metalness: 0.99,
        roughness: 0.08,
        envMapIntensity: 2.5,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      }),
    [goldColor],
  )

  // Position on the front of the band where stones sit (outer edge, +Z).
  const stoneRadius = bandRadius + tubeRadius * 0.4
  const isAsym = style.startsWith('asym')

  return (
    <group {...group}>
      {/* The asym designs share a sculpted band; the others use a plain torus. */}
      {isAsym ? (
        <AsymBand bandRadius={bandRadius} goldMaterial={goldMaterial} />
      ) : (
        <mesh rotation={[Math.PI / 2, 0, 0]} material={goldMaterial} castShadow receiveShadow>
          <torusGeometry args={[bandRadius, tubeRadius, 32, 128]} />
        </mesh>
      )}

      {style === 'solitaire' && <Solitaire stoneRadius={stoneRadius} goldMaterial={goldMaterial} />}
      {style === 'pave' && (
        <Pave bandRadius={bandRadius} tubeRadius={tubeRadius} goldMaterial={goldMaterial} />
      )}
      {isAsym && (
        <AsymSetting
          bandRadius={bandRadius}
          goldMaterial={goldMaterial}
          variant={style.slice(5) as AsymVariant}
          flip={flip}
        />
      )}
    </group>
  )
}

/**
 * Single centre stone in a four-prong setting, standing up off the band.
 *
 * The assembly is built pointing along local +Y (culet at the bottom, table at
 * the top) and then the whole group is rotated +90° about X so that +Y points
 * radially outward from the finger (+Z). Result: the culet rests on the band
 * and the table faces away from the finger.
 */
function Solitaire({
  stoneRadius,
  goldMaterial,
}: {
  stoneRadius: number
  goldMaterial: THREE.Material
}) {
  const gemSize = 0.62

  return (
    <group position={[0, 0, stoneRadius]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Basket / setting, tucked just under the culet (toward the band). */}
      <mesh position={[0, -gemSize * 0.1, 0]} material={goldMaterial} castShadow>
        <cylinderGeometry args={[gemSize * 0.34, gemSize * 0.18, gemSize * 0.45, 12]} />
      </mesh>
      {/* Four prongs gripping the girdle. */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        const pr = gemSize * 0.42
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * pr, gemSize * 0.36, Math.sin(a) * pr]}
            material={goldMaterial}
            castShadow
          >
            <capsuleGeometry args={[gemSize * 0.05, gemSize * 0.4, 4, 8]} />
          </mesh>
        )
      })}
      {/* Gem pulled inward so the culet tucks down into the band. */}
      <Gem size={gemSize} position={[0, gemSize * 0.46, 0]} />
    </group>
  )
}

/** A shared row of small stones across the front arc of the band (pavé). */
function Pave({
  bandRadius,
  tubeRadius,
  goldMaterial,
}: {
  bandRadius: number
  tubeRadius: number
  goldMaterial: THREE.Material
}) {
  const stones = useMemo(() => {
    const count = 9
    const spread = Math.PI * 0.5 // arc covered across the front of the band
    const arr: { angle: number; size: number }[] = []
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1)
      const angle = (t - 0.5) * spread // 0 == front of the band (+Z)
      // bigger in the middle, tapering to the sides
      const size = 0.34 - Math.abs(t - 0.5) * 0.28
      arr.push({ angle, size })
    }
    return arr
  }, [])

  const r = bandRadius + tubeRadius * 0.55 // sit on the outer face of the band

  return (
    <group>
      {stones.map((s, i) => (
        // Outer group sweeps the stone around the front arc; inner group tips it
        // up so the table faces radially outward (local +Y -> outward), matching
        // how the solitaire stands off the band.
        <group key={i} rotation={[0, s.angle, 0]}>
          <group position={[0, 0, r]} rotation={[Math.PI / 2, 0, 0]}>
            {/* bezel cup, opening outward */}
            <mesh position={[0, -s.size * 0.15, 0]} material={goldMaterial} castShadow>
              <cylinderGeometry args={[s.size * 0.55, s.size * 0.42, s.size * 0.4, 10]} />
            </mesh>
            <Gem size={s.size} position={[0, s.size * 0.35, 0]} />
          </group>
        </group>
      ))}
    </group>
  )
}

// Outward distance of the flat top from the finger centre (used by the setting).
const FLAT_TOP = (bandRadius: number) => bandRadius + 0.05 + 0.09

/**
 * Recreation of the asymmetric band: a thin round band over most of the ring,
 * with a protruding FLAT TOP bar across the front. The flat top is a horizontal
 * chord sitting outside the band circle, joined to the band by two vertical
 * right-angle shoulders (the "wings"). It extends further to one side, so the
 * bar is asymmetric. Built by extruding this 2D outline along the finger axis.
 */
function AsymBand({
  bandRadius,
  goldMaterial,
  cornerRadius = 0.4,
}: {
  bandRadius: number
  goldMaterial: THREE.Material
  /** Fillet radius applied to the two top corners of the flat bar. */
  cornerRadius?: number
}) {
  const geometry = useMemo(() => {
    const Rin = bandRadius // finger / inner radius
    const Rout = Rin + 0.05 // round band outer radius
    const yTop = FLAT_TOP(bandRadius) // height of the flat top
    const xL = -0.99 // left end of the flat bar
    const xR = 0.99 // right end (extends further => asymmetric)
    const yL = Math.sqrt(Rout * Rout - xL * xL)
    const yR = Math.sqrt(Rout * Rout - xR * xR)
    const aL = Math.atan2(yL, xL)
    const aR = Math.atan2(yR, xR)
    // Keep the fillet from overrunning the flat top or the shoulders.
    const cr = Math.max(0, Math.min(cornerRadius, (xR - xL) / 2, yTop - yR, yTop - yL))

    // Outer outline (CCW): the long circular arc through the bottom, then up the
    // right shoulder, across the flat top (with rounded corners), and down the
    // left shoulder.
    const outer = new THREE.Shape()
    const steps = 220
    const start = aL
    const end = aR + Math.PI * 2
    for (let i = 0; i <= steps; i++) {
      const a = start + (end - start) * (i / steps)
      const x = Math.cos(a) * Rout
      const y = Math.sin(a) * Rout
      if (i === 0) outer.moveTo(x, y)
      else outer.lineTo(x, y)
    }
    outer.lineTo(xR, yTop - cr) // right shoulder up, stopping short of the corner
    outer.quadraticCurveTo(xR, yTop, xR - cr, yTop) // round the top-right corner
    outer.lineTo(xL + cr, yTop) // across the flat top, stopping short
    outer.quadraticCurveTo(xL, yTop, xL, yTop - cr) // round the top-left corner
    outer.lineTo(xL, yL) // left shoulder down (back to start)

    const hole = new THREE.Path()
    hole.absarc(0, 0, Rin, 0, Math.PI * 2, true)
    outer.holes.push(hole)

    const depth = 0.14 // band width along the finger axis
    const bevel = 0.03
    const geo = new THREE.ExtrudeGeometry(outer, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 48,
    })
    geo.translate(0, 0, -depth / 2) // centre on the finger axis
    geo.rotateX(Math.PI / 2) // flat top -> +Z (front); hole -> Y
    geo.computeVertexNormals()
    return geo
  }, [bandRadius, cornerRadius])

  return <mesh geometry={geometry} material={goldMaterial} castShadow receiveShadow />
}

// Deep garnet-red stone material, shared by the cushion gem.
const RED_GEM = new THREE.MeshPhysicalMaterial({
  color: '#c01024',
  metalness: 0,
  roughness: 0.04,
  transmission: 0.15,
  thickness: 0.3,
  ior: 1.77,
  attenuationColor: new THREE.Color('#7a0010'),
  attenuationDistance: 0.6,
  reflectivity: 1,
  clearcoat: 1,
  clearcoatRoughness: 0,
  flatShading: true,
  envMapIntensity: 3.4,
  side: THREE.DoubleSide,
})

// Emerald-green stone material.
const GREEN_GEM = new THREE.MeshPhysicalMaterial({
  color: '#0a7d3c',
  metalness: 0,
  roughness: 0.05,
  transmission: 0.2,
  thickness: 0.3,
  ior: 1.57,
  attenuationColor: new THREE.Color('#054f24'),
  attenuationDistance: 0.6,
  reflectivity: 1,
  clearcoat: 1,
  clearcoatRoughness: 0,
  flatShading: true,
  envMapIntensity: 3.4,
  side: THREE.DoubleSide,
})

// Vivid blue topaz stone material. Saturated like the red/green gems (low
// transmission + deep attenuation) so the bright facet reflections don't wash
// the colour out to near-white.
const BLUE_GEM = new THREE.MeshPhysicalMaterial({
  color: '#0a5fd6',
  metalness: 0,
  roughness: 0.05,
  transmission: 0.16,
  thickness: 0.3,
  ior: 1.6,
  attenuationColor: new THREE.Color('#062f86'),
  attenuationDistance: 0.6,
  reflectivity: 1,
  clearcoat: 1,
  clearcoatRoughness: 0,
  flatShading: true,
  envMapIntensity: 3.4,
  side: THREE.DoubleSide,
})

/**
 * A faceted rounded-square (cushion) gem, built from a rounded-square girdle:
 * crown sloping in to a smaller table, pavilion tapering down to a culet point.
 * `size` sets the square footprint (side = 0.707 * size); `cornerFrac` is the
 * corner-rounding as a fraction of the half-width (0 = sharp square).
 */
function CushionGem({
  size = 1,
  cornerFrac = 0.28,
  aspect = 1,
  material = RED_GEM,
}: {
  size?: number
  cornerFrac?: number
  /** >1 stretches the stone along X (tangential) for a rectangular cut. */
  aspect?: number
  material?: THREE.Material
}) {
  const geometry = useMemo(() => {
    const hwG = 0.354 * size // girdle half-width
    const hwT = 0.3 * size // table half-width (fuller table)
    const tableY = 0.12 * size
    const culetY = -0.4 * size

    // A rounded square as a ring of points (CCW), corners replaced by quarter arcs.
    const roundedSquare = (hw: number, cr: number, perCorner = 5): [number, number][] => {
      const c = hw - cr
      const corners: [number, number, number][] = [
        [c, -c, -Math.PI / 2],
        [c, c, 0],
        [-c, c, Math.PI / 2],
        [-c, -c, Math.PI],
      ]
      const pts: [number, number][] = []
      for (const [cx, cz, a0] of corners) {
        for (let k = 0; k <= perCorner; k++) {
          const a = a0 + (Math.PI / 2) * (k / perCorner)
          pts.push([cx + Math.cos(a) * cr, cz + Math.sin(a) * cr])
        }
      }
      return pts
    }

    const G = roundedSquare(hwG, cornerFrac * hwG)
    const T = roundedSquare(hwT, cornerFrac * hwT)
    const n = G.length

    const pos: number[] = []
    const idx: number[] = []
    const add = (x: number, y: number, z: number) => {
      pos.push(x, y, z)
      return pos.length / 3 - 1
    }
    const gIdx = G.map(([x, z]) => add(x, 0, z)) // girdle ring
    const tIdx = T.map(([x, z]) => add(x, tableY, z)) // table ring
    const culet = add(0, culetY, 0)
    const tableCenter = add(0, tableY, 0)

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(gIdx[i], gIdx[j], tIdx[j], gIdx[i], tIdx[j], tIdx[i]) // crown
      idx.push(tableCenter, tIdx[i], tIdx[j]) // table cap
      idx.push(gIdx[i], culet, gIdx[j]) // pavilion
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.setIndex(idx)
    geo.computeVertexNormals()
    return geo
  }, [size, cornerFrac])

  return <mesh geometry={geometry} material={material} castShadow scale={[aspect, 1, 1]} />
}

/**
 * The asymmetric setting, in three variants on the same flat-top bar:
 *  - 'garnet'   : red square cushion + one accent diamond
 *  - 'emerald'  : green rectangular cushion + one accent diamond
 *  - 'diamonds' : no coloured stone, a row of 10 small round diamonds
 * `flip` mirrors the stone layout to the other side of the bar.
 */
function AsymSetting({
  bandRadius,
  goldMaterial,
  variant,
  flip,
}: {
  bandRadius: number
  goldMaterial: THREE.Material
  variant: AsymVariant
  flip: boolean
}) {
  // Sit the stones on the flat top: bezel bottoms rest on the flat surface.
  const r = FLAT_TOP(bandRadius)
  const sx = flip ? -1 : 1 // mirror the layout left/right

  // No coloured stone: a row of 10 small round diamonds across the whole bar.
  if (variant === 'diamonds') {
    const count = 10
    const span = 1.56
    const dSize = 0.12
    const dBezel = dSize * 0.5 + 0.02
    return (
      <group position={[0, 0, r]} rotation={[Math.PI / 2, 0, 0]}>
        {Array.from({ length: count }).map((_, i) => {
          const x = -span / 2 + span * (i / (count - 1))
          return (
            <group key={i} position={[x, 0, 0]}>
              <mesh position={[0, 0.022, 0]} material={goldMaterial} castShadow>
                <cylinderGeometry args={[dBezel, dBezel * 0.85, 0.07, 24]} />
              </mesh>
              <Gem size={dSize} position={[0, 0.05, 0]} />
            </group>
          )
        })}
      </group>
    )
  }

  // Coloured-stone variants: a main stone + one accent diamond.
  // `cornerFrac: 1` makes the cushion a full circle; `round` swaps to a round bezel.
  const gem =
    variant === 'emerald'
      ? { material: GREEN_GEM, aspect: 1.5, cornerFrac: 0.28, round: false } // green rectangular
      : variant === 'topaz'
        ? { material: BLUE_GEM, aspect: 1, cornerFrac: 1, round: true } // light-blue round
        : { material: RED_GEM, aspect: 1, cornerFrac: 0.28, round: false } // red square
  const cushion = 0.3
  const stoneSide = cushion * 0.807
  const bezelW = stoneSide * gem.aspect + 0.05
  const bezelD = stoneSide + 0.05
  const accent = 0.17
  const accentBezel = accent * 0.5 + 0.022

  // Emerald puts the accent diamond on the outside and the cushion inboard;
  // the others keep the main stone outside.
  const cushionX = variant === 'emerald' ? -0.38 : -0.45
  const accentX = variant === 'emerald' ? -0.74 : 0.01

  return (
    <group position={[0, 0, r]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Main stone. */}
      <group position={[sx * cushionX, 0, 0]}>
        {gem.round ? (
          <mesh position={[0, 0.02, 0]} material={goldMaterial} castShadow>
            <cylinderGeometry args={[bezelD * 0.5, bezelD * 0.46, 0.09, 32]} />
          </mesh>
        ) : (
          <RoundedBox
            args={[bezelW, 0.09, bezelD]}
            radius={0.035}
            smoothness={6}
            position={[0, 0.02, 0]}
            castShadow
          >
            <primitive object={goldMaterial} attach="material" />
          </RoundedBox>
        )}
        <group position={[0, 0.05, 0]}>
          <CushionGem
            size={cushion}
            aspect={gem.aspect}
            cornerFrac={gem.cornerFrac}
            material={gem.material}
          />
        </group>
      </group>
      {/* Round accent diamond, to the other side of the cushion. */}
      <group position={[sx * accentX, 0, -0.01]}>
        <mesh position={[0, 0.025, 0]} material={goldMaterial} castShadow>
          <cylinderGeometry args={[accentBezel, accentBezel * 0.85, 0.08, 28]} />
        </mesh>
        <Gem size={accent} position={[0, 0.05, 0]} />
      </group>
    </group>
  )
}
