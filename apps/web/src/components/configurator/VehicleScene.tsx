"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import type { ElementRef, MutableRefObject } from "react";
import type { EditionId, FinishId, PowertrainId } from "./vehicleFinish";
import { FINISH_PHYSICAL } from "./vehicleFinish";

export type CameraPreset = "threeQuarter" | "side" | "front" | "top";

type SportsCarProps = {
  finishId: FinishId;
  edition: EditionId;
  powertrain: PowertrainId;
};

function SportsCar({ finishId, edition, powertrain }: SportsCarProps) {
  const mat = FINISH_PHYSICAL[finishId];
  const color = useMemo(() => new THREE.Color(mat.hex), [mat.hex]);
  const showSpoiler = edition === "Track";
  const hybridStripe = powertrain === "Hybrid";

  return (
    <group position={[0, 0, 0]}>
      <RoundedBox
        args={[2.35, 0.48, 1.05]}
        radius={0.09}
        smoothness={5}
        position={[0, 0.38, 0.02]}
        castShadow
      >
        <meshPhysicalMaterial
          color={color}
          roughness={mat.roughness}
          metalness={mat.metalness}
          clearcoat={mat.clearcoat}
          clearcoatRoughness={0.12}
          envMapIntensity={1.15}
        />
      </RoundedBox>

      <RoundedBox
        args={[1.15, 0.32, 0.78]}
        radius={0.06}
        smoothness={4}
        position={[0, 0.72, -0.08]}
        castShadow
      >
        <meshPhysicalMaterial
          color="#050608"
          roughness={0.08}
          metalness={0.25}
          transmission={0.72}
          thickness={0.4}
          transparent
          opacity={0.92}
          envMapIntensity={1.4}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.55, 0.2, 0.88]}
        radius={0.05}
        smoothness={3}
        position={[1.28, 0.36, 0]}
        castShadow
      >
        <meshPhysicalMaterial
          color={color}
          roughness={mat.roughness + 0.04}
          metalness={mat.metalness}
          clearcoat={mat.clearcoat}
          clearcoatRoughness={0.14}
        />
      </RoundedBox>

      {showSpoiler && (
        <RoundedBox
          args={[0.95, 0.06, 0.18]}
          radius={0.02}
          smoothness={2}
          position={[-1.22, 0.78, 0]}
          castShadow
        >
          <meshPhysicalMaterial
            color={color}
            roughness={0.35}
            metalness={0.6}
            clearcoat={0.9}
          />
        </RoundedBox>
      )}

      {hybridStripe && (
        <mesh position={[0, 0.42, 0.54]} rotation={[0, 0, 0]}>
          <planeGeometry args={[1.6, 0.04]} />
          <meshStandardMaterial
            color="#0d3d32"
            emissive="#1dd4b0"
            emissiveIntensity={0.55}
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>
      )}

      <mesh position={[1.32, 0.32, 0.28]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.22, 0.06]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fff8e8"
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>

      {[
        [-0.78, 0.18, 0.46],
        [-0.78, 0.18, -0.46],
        [0.78, 0.18, 0.46],
        [0.78, 0.18, -0.46],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.22, 28]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.85} metalness={0.15} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.23, 24]} />
            <meshStandardMaterial
              color="#1c1c1c"
              metalness={0.92}
              roughness={0.28}
              envMapIntensity={0.9}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CameraRig({
  controlsRef,
  preset,
  onPresetApplied,
}: {
  controlsRef: MutableRefObject<ElementRef<typeof OrbitControls> | null>;
  preset: CameraPreset | null;
  onPresetApplied: () => void;
}) {
  const { camera } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!preset || !controls) return;

    const target = new THREE.Vector3(0, 0.38, 0);
    const pos = new THREE.Vector3();

    switch (preset) {
      case "threeQuarter":
        pos.set(4.6, 1.85, 5.2);
        break;
      case "side":
        pos.set(7.2, 1.35, 0.15);
        break;
      case "front":
        pos.set(0.1, 1.55, 6.8);
        break;
      case "top":
        pos.set(0.2, 8.4, 0.35);
        break;
      default:
        pos.set(4.6, 1.85, 5.2);
    }

    camera.position.copy(pos);
    controls.target.copy(target);
    controls.update();
    onPresetApplied();
  }, [preset, camera, controlsRef, onPresetApplied]);

  return null;
}

export type VehicleSceneProps = SportsCarProps & {
  cameraPreset: CameraPreset | null;
  onPresetApplied: () => void;
  autoRotate: boolean;
  /** When true, gently rotate the car when user is not dragging (handled by orbit autoRotate instead — we use orbit autoRotate) */
  compact?: boolean;
};

export function VehicleScene({
  finishId,
  edition,
  powertrain,
  cameraPreset,
  onPresetApplied,
  autoRotate,
  compact,
}: VehicleSceneProps) {
  const controlsRef = useRef<ElementRef<typeof OrbitControls>>(null);

  return (
    <>
      <color attach="background" args={["#06080c"]} />
      <ambientLight intensity={0.35} />
      <spotLight
        position={[6, 9, 4]}
        angle={0.42}
        penumbra={0.85}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight position={[-5, 4, -3]} angle={0.55} penumbra={1} intensity={0.45} color="#b8a878" />
      <directionalLight position={[-3, 6, 2]} intensity={0.55} color="#e8e4dc" />

      <Environment preset={compact ? "studio" : "city"} />

      <SportsCar finishId={finishId} edition={edition} powertrain={powertrain} />

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.55}
        scale={14}
        blur={2.4}
        far={9}
        color="#000000"
      />

      {!compact && (
        <Grid
          position={[0, -0.01, 0]}
          args={[20, 20]}
          cellSize={0.35}
          cellThickness={0.6}
          cellColor="#2a2418"
          sectionSize={3.5}
          sectionThickness={1.1}
          sectionColor="#3d3428"
          fadeDistance={22}
          fadeStrength={1}
          infiniteGrid
        />
      )}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        enablePan={false}
        dampingFactor={0.06}
        minDistance={compact ? 4 : 3.2}
        maxDistance={compact ? 14 : 16}
        minPolarAngle={0.28}
        maxPolarAngle={Math.PI / 2.05}
        maxAzimuthAngle={Infinity}
        autoRotate={autoRotate}
        autoRotateSpeed={0.45}
        target={[0, 0.38, 0]}
      />

      <CameraRig
        controlsRef={controlsRef}
        preset={cameraPreset}
        onPresetApplied={onPresetApplied}
      />
    </>
  );
}
