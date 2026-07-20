import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useScrollStore } from "@/store/useScrollStore";

export function Hero3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  const scrollProgress = useScrollStore((state) => state.scrollProgress);
  const activeSection = useScrollStore((state) => state.activeSection);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Rotate slowly over time
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;

    // React to scroll progress (fade/move out when not in hero)
    if (activeSection === "hero") {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 0.1);
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.1));
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 5, 0.1);
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, 0.5, 0.1));
    }
  });

  return (
    <Sphere ref={meshRef} args={[1.5, 64, 64]} position={[0, 0, 0]}>
      <MeshDistortMaterial
        color="#eb5f3d"
        envMapIntensity={0.4}
        clearcoat={0.8}
        clearcoatRoughness={0}
        metalness={0.1}
        roughness={0.4}
        distort={0.3}
        speed={2}
        wireframe={true}
      />
    </Sphere>
  );
}
