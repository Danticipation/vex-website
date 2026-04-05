"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";

/** Drive `uCinematicTime` for materials from `applyCinematicLuxuryPaint`. */
export function CinematicPaintTimeTicker({ root }: { root: THREE.Object3D | null }) {
  const ref = useRef<THREE.Object3D | null>(null);
  ref.current = root;

  useFrame(({ clock }) => {
    const obj = ref.current;
    if (!obj) return;
    const u = obj.userData.__cinematicSharedTime as THREE.IUniform<number> | undefined;
    if (u) u.value = clock.elapsedTime;
  });

  return null;
}
