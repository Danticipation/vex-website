"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useWebglEligible } from "@/hooks/useWebglEligible";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import styles from "./HeroParticleField.module.css";

function heroParticlesEnvEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_HERO_PARTICLES;
  if (v === "0" || v === "false") return false;
  return true;
}

function ParticleCloud() {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = 280;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 6.5;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3.8;
      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = r * Math.sin(theta) * 0.82;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((state) => {
    const p = ref.current;
    if (!p) return;
    const t = state.clock.elapsedTime;
    p.rotation.y = t * 0.028;
    p.rotation.x = Math.sin(t * 0.07) * 0.045;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        transparent
        opacity={0.42}
        size={0.036}
        sizeAttenuation
        color="#d4b86a"
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function HeroParticleField() {
  const webgl = useWebglEligible();
  const reduced = usePrefersReducedMotion();
  const enabled = heroParticlesEnvEnabled();

  if (!enabled || webgl !== true || reduced) return null;

  return (
    <div className={styles.wrap} aria-hidden>
      <Canvas
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.25, 6.8], fov: 40 }}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <Suspense fallback={null}>
          <ParticleCloud />
        </Suspense>
      </Canvas>
    </div>
  );
}
