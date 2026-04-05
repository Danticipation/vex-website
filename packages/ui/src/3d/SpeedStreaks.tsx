"use client";

import type { MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

/** Subtle radial speed streaks — additive; opacity scales with scroll velocity ref (Apex). */
export function SpeedStreaks({
  count = 10,
  velocityRef,
}: {
  count?: number;
  velocityRef?: MutableRefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const materials = useRef<THREE.MeshBasicMaterial[]>([]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    g.rotation.z = state.clock.elapsedTime * 0.12;
    if (materials.current.length === 0) {
      g.traverse((o) => {
        if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshBasicMaterial) {
          materials.current.push(o.material);
        }
      });
    }
    const v = velocityRef?.current ?? 0;
    const op = 0.06 + Math.min(1, v) * 0.55;
    for (const m of materials.current) {
      m.opacity = op;
    }
  });

  return (
    <group ref={group} position={[0, 0.9, 1.2]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} rotation={[0, 0, (i / count) * Math.PI * 2]}>
          <planeGeometry args={[0.015, 0.9 + (i % 3) * 0.15]} />
          <meshBasicMaterial
            color="#d4b86a"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
