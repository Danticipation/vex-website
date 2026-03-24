"use client";

import { ConfiguratorVehicleCanvas } from "@/components/configurator/ConfiguratorVehicleCanvas";
import styles from "./ExoticVisualization.module.css";

/**
 * Hero 3D strip — same WebGL studio as the configure section, compact + minimal chrome.
 */
export function ExoticVisualization() {
  return (
    <div className={styles.stage}>
      <div className={styles.hud}>
        <span className={styles.badge}>Lot preview</span>
        <span className={styles.sub}>Orbit · Zoom · Studio lit</span>
      </div>
      <ConfiguratorVehicleCanvas
        compact
        minimal
        embed
        finishId="rosso"
        edition="Launch"
        powertrain="V12"
      />
    </div>
  );
}
