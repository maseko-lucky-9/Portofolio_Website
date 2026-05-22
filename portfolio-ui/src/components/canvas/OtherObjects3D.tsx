import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollStore } from '@/store/useScrollStore';

export function Projects3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  const activeSection = useScrollStore((state) => state.activeSection);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    
    if (activeSection === 'projects') {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 0.1);
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -10, 0.1);
    }
  });

  return (
    <Box ref={meshRef} args={[2, 1.5, 0.1]} position={[-2, -10, -2]}>
      <meshStandardMaterial color="#eb5f3d" metalness={0.8} roughness={0.2} />
    </Box>
  );
}

export function CodeDemo3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  const activeSection = useScrollStore((state) => state.activeSection);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
    
    if (activeSection === 'codedemo') {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 0.1);
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -10, 0.1);
    }
  });

  return (
    <Cylinder ref={meshRef} args={[1, 1, 2, 32]} position={[2, -10, -2]}>
      <meshStandardMaterial color="#a1a5a9" wireframe />
    </Cylinder>
  );
}

export function Experience3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  const activeSection = useScrollStore((state) => state.activeSection);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    if (activeSection === 'experience' || activeSection === 'services') {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 0.1);
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -10, 0.1);
    }
  });

  return (
    <Box ref={meshRef} args={[0.5, 3, 0.5]} position={[-2, -10, -3]}>
      <meshStandardMaterial color="#eff2f5" wireframe />
    </Box>
  );
}

export function Contact3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  const activeSection = useScrollStore((state) => state.activeSection);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.2;
    if (activeSection === 'contact') {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 0.1);
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -10, 0.1);
    }
  });

  return (
    <Cylinder ref={meshRef} args={[0, 1, 1.5, 4]} position={[0, -10, -2]} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#df2225" roughness={0.1} metalness={0.8} />
    </Cylinder>
  );
}
