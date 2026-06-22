import { useMemo } from 'react'
import { Environment, ContactShadows, OrbitControls } from '@react-three/drei'
import {
  Physics,
  RigidBody,
  BallCollider,
  CuboidCollider,
  CylinderCollider,
} from '@react-three/rapier'
import { Ring, type RingStyle } from './Ring'
import { Finger } from './Finger'

/** Gravity mode: 'off' floats, 'floor' piles on the ground, 'finger' slides down the finger. */
export type GravityMode = 'off' | 'floor' | 'finger'

const GROUND_Y = -1.8 // floor height in floor-gravity mode
const KNUCKLE_Y = -2.4 // where the finger's knuckle sits (matches Finger.tsx)

export type GoldTone = 'yellow' | 'rose' | 'white'

const GOLD: Record<GoldTone, string> = {
  yellow: '#e8c16b', // polished yellow gold (from the necklace POC)
  rose: '#e8b59b',
  white: '#e8e8ea', // polished white gold (from the necklace POC)
}

/** One of the three selectable ring slots. 'none' = empty. */
export type Slot = {
  style: RingStyle | 'none'
  flip: boolean
  turn: number // degrees around the finger axis
}

export type SceneProps = {
  gold: GoldTone
  gap: number
  slots: Slot[]
  showFinger: boolean
  autoRotate: boolean
  /** Gravity mode: float, pile on the floor, or slide down the finger. */
  gravity: GravityMode
  /** Optional orbit target override (for framed screenshots). */
  target?: [number, number, number]
}

/**
 * A ring as a physics rigid body. The torus is approximated by a compound of
 * small ball colliders arranged in a circle — this keeps the hole (a convex
 * hull would fill it) and is stable for dynamic stacking.
 */
function RingBody({
  slot,
  bandRadius,
  goldColor,
  spawnY,
}: {
  slot: Slot
  bandRadius: number
  goldColor: string
  spawnY: number
}) {
  const balls = useMemo(() => {
    const n = 24
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2
      return [Math.cos(a) * bandRadius, 0, Math.sin(a) * bandRadius] as [number, number, number]
    })
  }, [bandRadius])

  return (
    <RigidBody
      colliders={false}
      position={[0, spawnY, 0]}
      rotation={[0, (slot.turn * Math.PI) / 180, 0]}
      restitution={0.15}
      friction={0.9}
      linearDamping={0.3}
      angularDamping={0.6}
      ccd
    >
      <Ring
        bandRadius={bandRadius}
        goldColor={goldColor}
        style={slot.style as RingStyle}
        flip={slot.flip}
      />
      {balls.map((p, i) => (
        <BallCollider key={i} args={[0.12]} position={p} />
      ))}
    </RigidBody>
  )
}

/**
 * The full visualizer scene: a studio HDR for reflections, up to three stacked
 * rings (chosen per slot) on a finger, and contact shadows on the floor.
 */
export function Scene({ gold, gap, slots, showFinger, autoRotate, gravity, target }: SceneProps) {
  const goldColor = GOLD[gold]
  const fingerRadius = 0.9
  const bandRadius = fingerRadius + 0.04 // slight clearance so the band hugs the finger
  const physics = gravity !== 'off'

  // Only filled slots stack, centred on the finger; gap sets the spacing.
  const visible = slots.filter((s) => s.style !== 'none')
  const baseY = -0.6
  const orbitY = gravity === 'finger' ? -1.6 : gravity === 'floor' ? GROUND_Y + 0.6 : 0.2

  return (
    <>
      {/* Discrete lights kept low — the studio HDR drives the look (as in the POC).
          The key light stays for crisp highlights and to cast the contact shadow. */}
      <ambientLight intensity={0.12} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} castShadow />
      <directionalLight position={[-6, 3, -4]} intensity={0.25} color="#aab8ff" />

      {/* Studio HDR (from the necklace POC) drives accurate metal reflections.
          background={false} keeps the CSS store backdrop visible behind the canvas. */}
      <Environment files="/studio.hdr" environmentIntensity={2.6} />

      {physics ? (
        // Gravity mode: rings spawn at staggered heights and fall, colliding and
        // settling — onto a floor (pile) or down the finger (stack at the base).
        <Physics gravity={[0, -9.81, 0]}>
          {visible.map((s, i) => (
            <RingBody
              key={`${gravity}-${i}-${s.style}-${s.flip}`}
              slot={s}
              bandRadius={bandRadius}
              goldColor={goldColor}
              spawnY={0.7 + i * 1.4}
            />
          ))}

          {gravity === 'finger' ? (
            <>
              {/* Visual finger + a thinner collider so the ring holes thread onto it,
                  with a wide knuckle ball that stops them sliding off the bottom. */}
              <Finger radius={fingerRadius} position={[0, -1, 0]} />
              <RigidBody type="fixed" friction={0.5}>
                <CylinderCollider args={[2.5, 0.78]} position={[0, 0.2, 0]} />
                <BallCollider args={[0.95]} position={[0, KNUCKLE_Y, 0]} />
              </RigidBody>
              {/* Far safety floor so a stray ring never falls forever. */}
              <RigidBody type="fixed">
                <CuboidCollider args={[8, 0.1, 8]} position={[0, -6, 0]} />
              </RigidBody>
              <ContactShadows position={[0, KNUCKLE_Y - 0.1, 0]} opacity={0.5} scale={10} blur={2.2} far={5} />
            </>
          ) : (
            <>
              {/* Invisible floor the rings pile onto. */}
              <RigidBody type="fixed" friction={0.9}>
                <CuboidCollider args={[8, 0.1, 8]} position={[0, GROUND_Y - 0.1, 0]} />
              </RigidBody>
              <ContactShadows position={[0, GROUND_Y, 0]} opacity={0.55} scale={14} blur={2.2} far={6} />
            </>
          )}
        </Physics>
      ) : (
        <>
          {showFinger && <Finger radius={fingerRadius} position={[0, -1, 0]} />}

          {visible.map((s, i) => {
            const y = baseY + (i - (visible.length - 1) / 2) * gap
            return (
              <Ring
                key={i}
                position={[0, y, 0]}
                rotation={[0, (s.turn * Math.PI) / 180, 0]}
                bandRadius={bandRadius}
                goldColor={goldColor}
                style={s.style as RingStyle}
                flip={s.flip}
              />
            )
          })}

          <ContactShadows position={[0, -2.6, 0]} opacity={0.5} scale={14} blur={2.4} far={6} />
        </>
      )}

      <OrbitControls
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        minDistance={4}
        maxDistance={16}
        target={target ?? [0, orbitY, 0]}
      />
    </>
  )
}
