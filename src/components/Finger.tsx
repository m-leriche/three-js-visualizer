import { useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'

type FingerProps = {
  radius?: number
  skinColor?: THREE.ColorRepresentation
} & ThreeElements['group']

/**
 * A stylised finger: a vertical, gently tapered cylinder with a rounded tip and
 * a hint of a knuckle. Just enough to read as a finger so the rings have
 * something to stack on.
 */
export function Finger({ radius = 0.9, skinColor = '#e8b08a', ...group }: FingerProps) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: skinColor,
        roughness: 0.7,
        metalness: 0,
      }),
    [skinColor],
  )

  return (
    <group {...group}>
      {/* Main shaft */}
      <mesh material={material} castShadow receiveShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[radius * 0.92, radius, 5, 32, 1]} />
      </mesh>
      {/* Rounded fingertip */}
      <mesh material={material} castShadow position={[0, 3.7, 0]}>
        <sphereGeometry args={[radius * 0.92, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* Knuckle swell below the rings */}
      <mesh material={material} castShadow position={[0, -1.4, 0]}>
        <sphereGeometry args={[radius * 1.04, 32, 24]} />
      </mesh>
    </group>
  )
}
