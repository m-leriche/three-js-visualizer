import { useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'

type GemProps = {
  /** Overall diameter of the stone (girdle width) in scene units. */
  size?: number
  /** Tint of the diamond. Pure white reads as colorless; add a hint for fancy stones. */
  color?: THREE.ColorRepresentation
} & ThreeElements['group']

/**
 * A faceted brilliant-cut gem built from a lathed profile.
 *
 * The profile traces a half cross-section of a round brilliant — culet point at
 * the bottom, widest at the girdle, then a short crown up to a flat table. Low
 * radial segment count + flat shading gives crisp facets that catch the lights.
 */
export function Gem({ size = 1, color = '#ffffff', ...group }: GemProps) {
  const geometry = useMemo(() => {
    // (radius from axis, height). Normalised to a ~1-unit-wide stone, scaled by `size`.
    const profile: [number, number][] = [
      [0.001, -0.62], // culet (pavilion tip)
      [0.5, 0.0], // girdle (widest point)
      [0.45, 0.14], // crown
      [0.3, 0.24], // table edge
      [0.0, 0.24], // table centre (closes the top flat)
    ]
    const points = profile.map(([r, y]) => new THREE.Vector2(r * size, y * size))
    const geo = new THREE.LatheGeometry(points, 14)
    geo.computeVertexNormals()
    return geo
  }, [size])

  return (
    <group {...group}>
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial
          color={color}
          metalness={0}
          roughness={0}
          // Low transmission keeps it from showing the dark background through
          // the stone, so the bright facet reflections read as a white diamond.
          transmission={0.3}
          thickness={size * 0.5}
          ior={2.42} // diamond's real index of refraction
          reflectivity={1}
          specularIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0}
          attenuationColor="#ffffff"
          flatShading
          envMapIntensity={3.5}
        />
      </mesh>
    </group>
  )
}
