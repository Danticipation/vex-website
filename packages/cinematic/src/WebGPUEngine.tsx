"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import type { ReactNode } from "react";

export type WebGPUEngineProps = Omit<CanvasProps, "gl"> & {
  children: ReactNode;
  /** When true, logs WebGPU availability once (dev / diagnostics). */
  logWebGPUStatus?: boolean;
};

/**
 * Hybrid renderer entry: **WebGL2** + advanced GLSL (`onBeforeCompile` on `MeshPhysicalMaterial`).
 * Same uniform graph ports to a future **WebGPU + TSL** path — native `WebGPURenderer` + async `init()` + post stack is Phase 2.
 * Use `hasWebGPU()` for diagnostics / investor “WebGPU ready” badges.
 */
export function WebGPUEngine({ children, logWebGPUStatus, ...rest }: WebGPUEngineProps) {
  if (logWebGPUStatus && typeof window !== "undefined") {
    const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { gpu?: unknown }) : undefined;
    const hasGpu = nav?.gpu != null;
    // eslint-disable-next-line no-console -- intentional dev diagnostic
    console.info(
      "[@vex/cinematic] WebGPU:",
      hasGpu ? "available" : "unavailable",
      "— renderer: WebGL2 + cinematic shaders"
    );
  }

  return (
    <Canvas
      {...rest}
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
    >
      {children}
    </Canvas>
  );
}
