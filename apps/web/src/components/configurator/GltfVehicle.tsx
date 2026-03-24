"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Bounds, Center, useGLTF } from "@react-three/drei";

type GltfVehicleProps = {
  url: string;
};

/**
 * Loads a glTF/GLB from URL, centers it, fits to bounds, enables shadows on meshes.
 * Intended for real vehicle scans or manufacturer PBR assets.
 */
export function GltfVehicle({ url }: GltfVehicleProps) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mat = mesh.material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            if (m && "envMapIntensity" in m) {
              (m as THREE.MeshStandardMaterial).envMapIntensity = Math.max(
                (m as THREE.MeshStandardMaterial).envMapIntensity ?? 1,
                0.85,
              );
            }
          });
        } else if (mat && "envMapIntensity" in mat) {
          (mat as THREE.MeshStandardMaterial).envMapIntensity = Math.max(
            (mat as THREE.MeshStandardMaterial).envMapIntensity ?? 1,
            0.85,
          );
        }
      }
    });
    return root;
  }, [scene]);

  return (
    <Bounds fit clip observe margin={1.25}>
      <Center>
        <primitive object={cloned} />
      </Center>
    </Bounds>
  );
}

/** Warm the loader cache for a listing URL (call from client when URL is known). */
export function preloadVehicleGltf(url: string) {
  useGLTF.preload(url);
}
