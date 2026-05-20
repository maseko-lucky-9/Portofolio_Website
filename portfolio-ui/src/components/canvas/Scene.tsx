import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { useProgress, Html } from '@react-three/drei';

import { Hero3D } from './Hero3D';
import { TechDeck } from './TechDeck';
import { Projects3D, CodeDemo3D, Experience3D, Contact3D } from './OtherObjects3D';

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress.toFixed(0)} % loaded</Html>;
}

export function Scene() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={<Loader />}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Hero3D />
          <TechDeck />
          <Projects3D />
          <CodeDemo3D />
          <Experience3D />
          <Contact3D />
        </Suspense>
      </Canvas>
    </div>
  );
}
