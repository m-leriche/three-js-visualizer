import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

/**
 * Real scanned female hand (Sketchfab, converted spec-gloss → metal-rough).
 * The raw model is ~25 units long, Z-forward, off-origin; the Sketchfab root
 * node already orients it Y-up. Scale it down via the `scale` prop so a finger
 * lines up with the ring stack.
 *
 * The scene's studio HDR is tuned hot for polished gold (high environment
 * intensity), which blows skin out to near-white. We clone the materials and
 * damp their environment response + raise roughness so the skin reads natural.
 */
export function HandModel(props: ThreeElements['group']) {
  const { scene } = useGLTF('/hand.glb')

  const tuned = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
      mat.envMapIntensity = 0.12 // skin shouldn't soak up the studio HDR like gold does
      mat.roughness = 1 // fully matte so it doesn't pick up hot specular highlights
      mat.metalness = 0
      // Warm tint knocks the blown-out diffuse back down to natural skin.
      mat.color = new THREE.Color('#c79a7d')
      mesh.material = mat
    })
    return root
  }, [scene])

  return (
    <group {...props}>
      <primitive object={tuned} />
    </group>
  )
}

useGLTF.preload('/hand.glb')
