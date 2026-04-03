"use client";

import type { CSSProperties, ReactNode } from "react";

const shimmerKeyframes = `
@keyframes vex-skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

const barBase: CSSProperties = {
  height: 14,
  borderRadius: 4,
  background: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 100%)",
  backgroundSize: "200% 100%",
  animation: "vex-skeleton-shimmer 1.35s ease-in-out infinite",
};

/** Injects shimmer keyframes once; wrap skeleton children. */
export function VexSkeletonPulse({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{shimmerKeyframes}</style>
      {children}
    </>
  );
}

/** Single shimmer bar (requires ancestor `VexSkeletonPulse` or duplicate keyframes). */
export function VexSkeletonBar({ width = "100%", height = 14, style }: { width?: string | number; height?: number; style?: CSSProperties }) {
  return <div aria-hidden style={{ ...barBase, width, height, ...style }} />;
}

/** Five table-row skeletons for deal desk list loading. */
export function VexSkeletonTableRows({ columns = 8, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <VexSkeletonPulse>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }} aria-hidden>
        <tbody>
          {Array.from({ length: rows }).map((_, ri) => (
            <tr key={ri} style={{ height: 40, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {Array.from({ length: columns }).map((_, ci) => (
                <td key={ci} style={{ padding: "0.5rem", width: `${100 / columns}%` }}>
                  <div style={barBase} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </VexSkeletonPulse>
  );
}
