"use client";

import type { CSSProperties } from "react";
import { FINISH_CSS_GRADIENT, type FinishId } from "./vehicleFinish";
import styles from "./StaticVehicleFallback.module.css";

type Props = {
  finishId: FinishId;
  /** Shown when WebGL is disabled (reduced motion, unsupported GPU, etc.) */
  subtitle?: string;
};

export function StaticVehicleFallback({ finishId, subtitle }: Props) {
  const glow = FINISH_CSS_GRADIENT[finishId];
  return (
    <div className={styles.panel} style={{ "--glow": glow } as CSSProperties}>
      <div className={styles.silhouette} aria-hidden />
      <p className={styles.kicker}>Studio preview</p>
      <p className={styles.sub}>
        {subtitle ??
          "Interactive 3D is off for this device or motion settings. Your selections still update pricing below."}
      </p>
    </div>
  );
}
