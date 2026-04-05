"use client";

import { useLayoutEffect } from "react";
import { Bounds, Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  VortexCarMaterialGLSL,
  type CinematicLuxuryPaintOptions,
  type CinematicPaintUniforms,
} from "@vex/cinematic";
import { applyHeroLuxuryCarPaint, type HeroLuxuryPaintOptions } from "./heroCarMaterial.js";

export type HeroGltfCarProps = {
  url: string;
  paintOptions?: HeroLuxuryPaintOptions;
  /** `cinematicLuxury` = `@vex/cinematic` GLSL patches. Set `standard` for PBR-only (e.g. env off). */
  paintMode?: "standard" | "cinematicLuxury";
  /** Live configurator / tenant uniforms — merged with defaults. */
  cinematicUniforms?: Partial<CinematicPaintUniforms>;
};

function StandardPaint({
  scene,
  paintOptions,
}: {
  scene: THREE.Group;
  paintOptions?: HeroLuxuryPaintOptions;
}) {
  useLayoutEffect(() => {
    applyHeroLuxuryCarPaint(scene, paintOptions);
  }, [scene, paintOptions]);
  return null;
}

export function HeroGltfCar({
  url,
  paintOptions,
  paintMode = "cinematicLuxury",
  cinematicUniforms,
}: HeroGltfCarProps) {
  const { scene } = useGLTF(url) as { scene: THREE.Group };
  const cinematic = paintMode === "cinematicLuxury";

  const cinematicOptions: CinematicLuxuryPaintOptions | undefined = cinematic
    ? {
        accentHex: paintOptions?.accentHex,
        iridescence: paintOptions?.iridescence,
        uniforms: cinematicUniforms,
      }
    : undefined;

  return (
    <Bounds fit clip observe margin={1.12}>
      <Center>
        {cinematic && cinematicOptions ? (
          <VortexCarMaterialGLSL object={scene} options={cinematicOptions} />
        ) : null}
        {!cinematic ? <StandardPaint scene={scene} paintOptions={paintOptions} /> : null}
        <primitive object={scene} />
      </Center>
    </Bounds>
  );
}
