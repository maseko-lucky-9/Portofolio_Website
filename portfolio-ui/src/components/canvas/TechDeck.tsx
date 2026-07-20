import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useScrollStore } from "@/store/useScrollStore";

const technologies = [
  { name: "React", color: "#61dafb" },
  { name: "Node.js", color: "#339933" },
  { name: "Tailwind", color: "#06b6d4" },
  { name: "TypeScript", color: "#3178c6" },
  { name: "Three.js", color: "#ffffff" },
];

export function TechDeck() {
  const groupRef = useRef<THREE.Group>(null);
  const activeSection = useScrollStore((state) => state.activeSection);
  const scrollProgress = useScrollStore((state) => state.scrollProgress);

  useFrame(() => {
    if (!groupRef.current) return;

    // When active, move into view and fan out based on scroll progress
    if (activeSection === "skills") {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);

      // Fan out cards based on local scroll progress (0 to 1) within the skills section
      // For now we'll just use a generic time-based animation to demonstrate
      // In a real implementation, this would tie directly to scrollProgress
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, -10, 0.1);
    }
  });

  return (
    <group ref={groupRef} position={[2, -10, -2]}>
      {technologies.map((tech, index) => {
        // Calculate a static fan-out position for demonstration
        const offset = index - technologies.length / 2;
        const xPos = offset * 1.5;
        const zPos = Math.abs(offset) * -0.5;
        const rotY = offset * -0.1;

        return (
          <group key={tech.name} position={[xPos, 0, zPos]} rotation={[0, rotY, 0]}>
            <RoundedBox args={[1.2, 1.8, 0.05]} radius={0.05} smoothness={4}>
              <meshStandardMaterial color="#0c1014" metalness={0.5} roughness={0.2} />
            </RoundedBox>
            <Text
              position={[0, 0, 0.03]}
              fontSize={0.2}
              color={tech.color}
              anchorX="center"
              anchorY="middle"
            >
              {tech.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
