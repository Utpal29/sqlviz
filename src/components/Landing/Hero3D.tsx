import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Mesh } from "three";
import * as THREE from "three";
import { useThemeStore } from "../../store/themeStore";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return reduced;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Constellation({ count = 90 }: { count?: number }) {
  const positions = useMemo(() => {
    const rand = mulberry32(0xc0ffee);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const phi = Math.acos(2 * rand() - 1);
      const theta = rand() * Math.PI * 2;
      const radius = 3.4 + rand() * 0.6;
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((_, delta) => {
    if (!reduced && ref.current) ref.current.rotation.y += delta * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#60A5FA" transparent opacity={0.85} />
    </points>
  );
}

function CoreMesh() {
  const meshRef = useRef<Mesh>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((_, delta) => {
    if (!reduced && meshRef.current) {
      meshRef.current.rotation.x += delta * 0.15;
      meshRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <Float
      speed={reduced ? 0 : 1.2}
      rotationIntensity={reduced ? 0 : 0.4}
      floatIntensity={reduced ? 0 : 0.6}
    >
      <Icosahedron ref={meshRef} args={[1.4, 1]}>
        <meshStandardMaterial
          color="#3B82F6"
          emissive="#1E40AF"
          emissiveIntensity={0.35}
          wireframe
          transparent
          opacity={0.9}
        />
      </Icosahedron>
      <Icosahedron args={[1.6, 0]}>
        <meshBasicMaterial color="#06B6D4" wireframe transparent opacity={0.25} />
      </Icosahedron>
    </Float>
  );
}

export function Hero3D() {
  const mode = useThemeStore((s) => s.mode);
  const fog = mode === "dark" ? "#0A0E17" : "#F5F6F8";

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={[fog]} />
      <fog attach="fog" args={[fog, 4, 12]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[6, 4, 6]} intensity={1.4} color="#3B82F6" />
      <pointLight position={[-6, -3, -4]} intensity={0.8} color="#06B6D4" />
      <CoreMesh />
      <Constellation />
    </Canvas>
  );
}
