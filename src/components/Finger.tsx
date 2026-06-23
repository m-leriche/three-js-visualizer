import { useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'

type FingerProps = {
  radius?: number
  skinColor?: THREE.ColorRepresentation
  nailColor?: THREE.ColorRepresentation
} & ThreeElements['group']

/**
 * A stylised finger to stack rings on. Built to read clearly as a finger
 * rather than a smooth rod: an oval (wider-than-deep) cross-section, gently
 * articulated knuckles, a flattened tip, and a fingernail. The oval squash and
 * the nail do most of the work; the rest just breaks up the otherwise uniform
 * shaft so it doesn't look like a featureless cylinder.
 */
export function Finger({
  radius = 0.9,
  skinColor = '#e8b08a',
  nailColor = '#f2dccf',
  ...group
}: FingerProps) {
  const skin = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: skinColor,
        roughness: 0.62,
        metalness: 0,
      }),
    [skinColor],
  )
  const nail = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: nailColor,
        roughness: 0.3,
        metalness: 0,
      }),
    [nailColor],
  )

  return (
    <group {...group}>
      {/* Oval cross-section — a finger is wider than it is deep. This single
          cue does most of the work of reading as a finger rather than a rod. */}
      <group scale={[1, 1, 0.78]}>
        {/* Proximal segment (below the rings) — the meatiest part. */}
        <mesh material={skin} castShadow receiveShadow position={[0, -0.3, 0]}>
          <cylinderGeometry args={[radius * 0.95, radius * 1.02, 2.6, 48, 1]} />
        </mesh>

        {/* Middle knuckle joint — a subtle flattened swell. */}
        <mesh material={skin} castShadow position={[0, 1.05, 0]} scale={[1.05, 0.7, 1.08]}>
          <sphereGeometry args={[radius * 0.95, 40, 28]} />
        </mesh>

        {/* Distal segment (above the rings) — tapers gently toward the tip. */}
        <mesh material={skin} castShadow receiveShadow position={[0, 2.2, 0]}>
          <cylinderGeometry args={[radius * 0.82, radius * 0.93, 2.0, 48, 1]} />
        </mesh>

        {/* Fingertip — a flattened dome, slightly narrower than the shaft. */}
        <mesh material={skin} castShadow position={[0, 3.18, 0]} scale={[1, 0.92, 1.12]}>
          <sphereGeometry
            args={[radius * 0.82, 40, 28, 0, Math.PI * 2, 0, Math.PI / 1.85]}
          />
        </mesh>

        {/* Base knuckle — a flattened, wider swell instead of a round ball, so
            it reads as the joint where the finger meets the hand. */}
        <mesh material={skin} castShadow position={[0, -1.7, 0]} scale={[1.18, 0.72, 1.05]}>
          <sphereGeometry args={[radius, 40, 28]} />
        </mesh>
      </group>

      {/* Fingernail on the back of the tip — an unambiguous finger cue. Kept
          outside the oval-squash group so it holds its own gentle curvature,
          and angled to follow the slope of the fingertip. */}
      <mesh
        material={nail}
        position={[0, 3.05, radius * 0.46]}
        rotation={[-Math.PI / 3.4, 0, 0]}
        scale={[radius * 0.6, radius * 0.85, radius * 0.12]}
      >
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
    </group>
  )
}
