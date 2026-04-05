"use client";

import { shouldUseWebGL } from "@vex/3d-configurator";
import { useLayoutEffect, useState } from "react";

/**
 * Client-only: null until measured (avoid SSR mismatch), then whether WebGL + motion policy allow 3D.
 */
export function useWebglEligible(): boolean | null {
  const [eligible, setEligible] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    const off = process.env.NEXT_PUBLIC_ENABLE_HERO_WEBGL;
    if (off === "0" || off === "false") {
      setEligible(false);
      return;
    }
    setEligible(shouldUseWebGL());
  }, []);

  return eligible;
}
