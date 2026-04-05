"use client";

import { Suspense, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { CinematicPaintUniforms } from "@vex/cinematic";
import type { HeroLuxuryPaintOptions } from "./heroCarMaterial.js";
import { HeroGltfCar } from "./HeroGltfCar.js";
import { ParticleVortex } from "./ParticleVortex.js";
import { SpeedStreaks } from "./SpeedStreaks.js";
import { VortexBurstParticles } from "./VortexBurstParticles.js";
import { VortexPostFXStack } from "./VortexPostFXStack.js";

export type VortexHeroBrand = {
  particleAccent?: string;
  paintAccentHex?: string;
  environmentPreset?: "city" | "studio" | "night" | "sunset" | "dawn" | "warehouse";
  /** Equirectangular HDR — when set, overrides `environmentPreset` for `Environment`. */
  environmentMapURL?: string;
  iridescence?: number;
  /** Tenant / CRM → `@vex/cinematic` uniforms (merged with paint options). */
  cinematicUniforms?: Partial<CinematicPaintUniforms>;
};

export type VortexHeroSceneProps = {
  scrollY: MutableRefObject<number>;
  glbUrl: string;
  cinematicMode?: boolean;
  /** White-label: tie 3D to tenant CSS / server `TenantCinematic3d` */
  brand?: VortexHeroBrand;
  /** Pass from Next (`NEXT_PUBLIC_CINEMATIC_SHADERS_V3`) — default cinematic luxury shaders. */
  paintMode?: "standard" | "cinematicLuxury";
  /** Apex v4: particle formation + scroll-linked streaks + post FX ramp */
  apexMode?: boolean;
  /** Apex: 0–1 hero visibility / scroll depth — god-rays + bloom */
  apexScrollBoost?: number;
  /** Apex: scroll velocity 0–1 for speed streaks */
  apexScrollVelocity?: MutableRefObject<number>;
  /** Apex: 0→1 particle formation; parent animates on load */
  formationProgress?: MutableRefObject<number>;
  /** Apex: CTA hover flash → burst particle opacity */
  burstFlashRef?: MutableRefObject<number>;
};

function CursorRimLight({ scrollBoost = 0 }: { scrollBoost?: number }) {
  const ref = useRef<THREE.SpotLight>(null);
  const { mouse } = useThree();
  useFrame(() => {
    const L = ref.current;
    if (!L) return;
    L.position.x = THREE.MathUtils.lerp(L.position.x, mouse.x * 8, 0.07);
    L.position.y = THREE.MathUtils.lerp(L.position.y, mouse.y * 4 + 3, 0.07);
    L.position.z = 5.5;
    const b = Math.min(1, Math.max(0, scrollBoost));
    L.intensity = 1.65 + b * 0.55 + (mouse.x * mouse.x + mouse.y * mouse.y) * 0.08;
  });
  return <spotLight ref={ref} intensity={1.65} angle={0.52} penumbra={0.92} color="#ffe8cc" />;
}

function RotatingCar({
  scrollY,
  glbUrl,
  paintOptions,
  paintMode,
  apexScrollBoost = 0,
  cinematicUniforms,
}: {
  scrollY: MutableRefObject<number>;
  glbUrl: string;
  paintOptions?: HeroLuxuryPaintOptions;
  paintMode?: "standard" | "cinematicLuxury";
  apexScrollBoost?: number;
  cinematicUniforms?: Partial<CinematicPaintUniforms>;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const boost = Math.min(1, Math.max(0, apexScrollBoost));
    g.rotation.y =
      state.clock.elapsedTime * 0.055 + scrollY.current * 0.00032 + boost * 0.2;
  });
  return (
    <group ref={group}>
      <HeroGltfCar
        url={glbUrl}
        paintOptions={paintOptions}
        paintMode={paintMode}
        cinematicUniforms={cinematicUniforms}
      />
    </group>
  );
}

/**
 * Full-viewport hero: PBR car, vortex particles, god-rays + post stack.
 * Consumers pass `glbUrl` (e.g. Khronos ToyCar or tenant CDN asset).
 */
export function VortexHeroScene({
  scrollY,
  glbUrl,
  cinematicMode = false,
  brand,
  paintMode = "cinematicLuxury",
  apexMode = false,
  apexScrollBoost = 0,
  apexScrollVelocity,
  formationProgress,
  burstFlashRef,
}: VortexHeroSceneProps) {
  const sunRef = useRef<THREE.Mesh>(null);
  const burstIntensity = cinematicMode ? 1.35 : 1;
  const envPreset = brand?.environmentPreset ?? "city";
  const paintOptions: HeroLuxuryPaintOptions | undefined =
    brand?.paintAccentHex || brand?.iridescence != null
      ? {
          accentHex: brand.paintAccentHex,
          iridescence: brand.iridescence,
        }
      : undefined;

  const cinematicUniforms = brand?.cinematicUniforms;

  useGLTF.preload(glbUrl);

  return (
    <Canvas
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.02, 6.2], fov: 38 }}
    >
      <color attach="background" args={["#050508"]} />
      <ambientLight intensity={0.22} />
      <directionalLight position={[4, 7, 5]} intensity={1.15} color="#d0e0ff" />
      <CursorRimLight scrollBoost={apexMode ? apexScrollBoost : 0} />
      <mesh ref={sunRef} position={[8, 6, -6]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshBasicMaterial color="#ffffee" />
      </mesh>
      <Suspense fallback={null}>
        {brand?.environmentMapURL ? (
          <Environment files={brand.environmentMapURL} />
        ) : (
          <Environment preset={envPreset} />
        )}
        <RotatingCar
          scrollY={scrollY}
          glbUrl={glbUrl}
          paintOptions={paintOptions}
          paintMode={paintMode}
          apexScrollBoost={apexScrollBoost}
          cinematicUniforms={cinematicUniforms}
        />
        <group position={[0, 1.2, 0]}>
          <ParticleVortex
            intensity={burstIntensity}
            scrollY={scrollY}
            accentColor={brand?.particleAccent ?? "#e8d5a4"}
            formationProgress={apexMode ? formationProgress : undefined}
          />
          <VortexBurstParticles intensity={burstIntensity * 0.65} flashRef={burstFlashRef} />
          {apexMode && apexScrollVelocity ? <SpeedStreaks velocityRef={apexScrollVelocity} /> : null}
        </group>
      </Suspense>
      <VortexPostFXStack
        sunRef={sunRef}
        cinematicMode={cinematicMode}
        apexBoost={apexMode ? apexScrollBoost : 0}
      />
    </Canvas>
  );
}
