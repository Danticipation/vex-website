"use client";

import type { MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const COUNT = 420;

/** Spiral vortex particle field — pairs with hero lighting (stylized “VEX” energy). */
export function VortexBurstParticles({
  intensity = 1,
  flashRef,
}: {
  intensity?: number;
  /** Apex: transient boost (e.g. CTA hover) — multiplied into opacity, decays in parent. */
  flashRef?: MutableRefObject<number>;
}) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 0.45 + Math.random() * 3.1;
      const a = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      pos[i * 3] = r * Math.cos(a) * Math.sqrt(1 - u * u);
      pos[i * 3 + 1] = r * u * 0.55;
      pos[i * 3 + 2] = r * Math.sin(a) * Math.sqrt(1 - u * u);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((state) => {
    const pts = ref.current;
    if (!pts) return;
    const t = state.clock.elapsedTime;
    pts.rotation.y = t * 0.14 * intensity;
    pts.rotation.x = Math.sin(t * 0.16) * 0.07 * intensity;
    pts.rotation.z = Math.cos(t * 0.11) * 0.04 * intensity;
    const mat = pts.material;
    if (mat instanceof THREE.PointsMaterial) {
      const flash = flashRef?.current ?? 0;
      mat.opacity = 0.4 * intensity * (1 + flash * 0.95);
    }
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        transparent
        opacity={0.4 * intensity}
        size={0.028}
        sizeAttenuation
        color="#d4b86a"
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
