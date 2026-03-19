import { useRef, useMemo, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import * as THREE from "three";

// Perlin noise GLSL (simplex 3D) — compact, GPU-only
const noiseGlsl = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
${noiseGlsl}

uniform float uTime;
uniform float uOpacity;
uniform vec2 uMouse;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Apply mouse parallax (subtle offset)
  uv += uMouse * 0.02;

  // Breathing cycle — 15-second period
  float breath = sin(uTime * 0.4189) * 0.5 + 0.5; // 2π / 15 ≈ 0.4189

  // Three noise layers at different scales and speeds
  float n1 = snoise(vec3(uv * 1.5, uTime * 0.15)) * 0.5 + 0.5;
  float n2 = snoise(vec3(uv * 2.5 + 10.0, uTime * 0.1 + 5.0)) * 0.5 + 0.5;
  float n3 = snoise(vec3(uv * 4.0 + 20.0, uTime * 0.08 + 10.0)) * 0.5 + 0.5;

  // Composite noise for aurora bands
  float aurora = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
  aurora = smoothstep(0.3, 0.7, aurora);
  aurora *= (0.7 + 0.3 * breath); // Breathing modulation

  // Color palette: blue → violet → emerald
  vec3 blue    = vec3(0.145, 0.388, 0.922);  // #2563eb
  vec3 violet  = vec3(0.545, 0.310, 0.839);  // #8b4fd7
  vec3 emerald = vec3(0.157, 0.714, 0.482);  // #28b67b

  // Blend colors using noise layers
  vec3 color = mix(blue, violet, n1);
  color = mix(color, emerald, n2 * 0.4);

  // Vignette — soft fade at edges
  float vignette = 1.0 - smoothstep(0.4, 1.2, length(vUv - 0.5) * 1.5);

  // Final composite
  float alpha = aurora * vignette * uOpacity;

  gl_FragColor = vec4(color, alpha);
}
`;

interface AuroraMeshProps {
  opacity: number;
  mouseRef: React.RefObject<{ x: number; y: number }>;
}

function AuroraMesh({ opacity, mouseRef }: AuroraMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uOpacity.value = opacity;
    material.uniforms.uResolution.value.set(size.width, size.height);

    if (mouseRef.current) {
      // Smooth interpolation toward mouse target
      const target = mouseRef.current;
      const current = material.uniforms.uMouse.value;
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function CSSGradientFallback() {
  return (
    <>
      <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-3xl" />
    </>
  );
}

export function AuroraBackground() {
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastMouseUpdate = useRef(0);

  const opacity = resolvedTheme === "dark" ? 0.35 : 0.25;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Throttle to ~60fps
    const now = performance.now();
    if (now - lastMouseUpdate.current < 16.67) return;
    lastMouseUpdate.current = now;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
    };
  }, []);

  // Reduced motion or fallback
  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <CSSGradientFallback />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <Suspense
        fallback={
          <div className="absolute inset-0 overflow-hidden">
            <CSSGradientFallback />
          </div>
        }
      >
        <Canvas
          dpr={[1, Math.min(window.devicePixelRatio, 2)]}
          gl={{ antialias: false, alpha: true }}
          camera={{ position: [0, 0, 1] }}
          style={{ position: "absolute", inset: 0 }}
          fallback={
            <div className="absolute inset-0 overflow-hidden">
              <CSSGradientFallback />
            </div>
          }
        >
          <AuroraMesh opacity={opacity} mouseRef={mouseRef} />
        </Canvas>
      </Suspense>
    </div>
  );
}

export { CSSGradientFallback };
