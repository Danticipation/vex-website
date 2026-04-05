"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { vexThemeTokens } from "./tokens.js";
import { vexLuxuryTokens as lux } from "./luxuryTokens.js";

const magneticEase = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Cursor-attract CTA wrapper — pair with an anchor or Next `Link` child. */
export function MagneticButton({
  children,
  className,
  strength = 0.35,
  style,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  style?: CSSProperties;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [off, setOff] = useState({ x: 0, y: 0 });

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = root.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      setOff({ x: (e.clientX - cx) * strength * 0.08, y: (e.clientY - cy) * strength * 0.08 });
    },
    [strength],
  );

  const onLeave = useCallback(() => setOff({ x: 0, y: 0 }), []);

  return (
    <div
      ref={root}
      className={className}
      style={{ position: "relative", display: "inline-flex", ...style }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        style={{
          transform: `translate3d(${off.x}px, ${off.y}px, 0)`,
          transition: `transform 0.35s ${magneticEase}`,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Perspective tilt card — use for KPI tiles and configurator pickers. */
export function Luxury3DCard({
  children,
  className,
  style,
  tilt = 9,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tilt?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = root.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      setRot({ x: -py * tilt, y: px * tilt });
    },
    [tilt],
  );

  const onLeave = useCallback(() => setRot({ x: 0, y: 0 }), []);

  return (
    <div
      ref={root}
      className={className}
      style={{
        perspective: 900,
        ...style,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        style={{
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          transformStyle: "preserve-3d",
          transition: `transform 0.45s ${magneticEase}`,
          willChange: "transform",
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Glass KPI tile with luxury border + optional emerald / gold bloom. */
export function GlassKPI({
  label,
  value,
  hint,
  accent = "gold",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "gold" | "emerald" | "sapphire";
}) {
  const glow =
    accent === "emerald"
      ? lux.neonBloomEmerald
      : accent === "sapphire"
        ? "0 0 28px rgba(77, 124, 255, 0.28)"
        : lux.neonBloomGold;

  return (
    <div
      style={{
        padding: "1rem 1.1rem",
        borderRadius: vexThemeTokens.radiusMd,
        background: lux.surfaceGlassLuxury,
        border: `1px solid ${lux.liquidMetalBorder}`,
        boxShadow: `${lux.volumetricShadow}, ${glow}`,
        backdropFilter: "blur(16px) saturate(1.2)",
      }}
    >
      <div
        style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--text-muted, rgba(168, 174, 191, 0.88))",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: "0.4rem",
          fontSize: "1.45rem",
          fontWeight: 700,
          background: lux.liquidMetal,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          color: "var(--text-primary, #f4f2ec)",
        }}
      >
        {value}
      </div>
      {hint ? (
        <div style={{ marginTop: "0.35rem", fontSize: "0.8rem", color: "var(--text-muted, rgba(160,168,190,0.85))" }}>{hint}</div>
      ) : null}
    </div>
  );
}

/** Magnetic CTA with liquid-metal rim + hover flash — pair with `Link` or `<a>`. */
export function LiquidMetalCTA({
  children,
  className,
  strength = 0.42,
  onLiquidFlash,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  /** Fires with the rim flash — e.g. sync WebGL burst particles (Apex hero). */
  onLiquidFlash?: () => void;
}) {
  const [flash, setFlash] = useState(0);
  const onEnter = useCallback(() => {
    setFlash(1);
    onLiquidFlash?.();
    window.setTimeout(() => setFlash(0), 200);
  }, [onLiquidFlash]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        borderRadius: 14,
        padding: 1,
        background: `linear-gradient(128deg, rgba(232,213,164,${0.42 + flash * 0.22}), rgba(97,193,255,0.28), rgba(201,169,98,0.48))`,
        boxShadow: flash
          ? `0 0 36px rgba(232, 213, 164, 0.42), ${lux.neonBloomGold}`
          : `0 0 18px rgba(201, 169, 98, 0.2)`,
        transition: "box-shadow 0.22s ease, background 0.22s ease",
      }}
      onMouseEnter={onEnter}
    >
      <MagneticButton strength={strength}>
        <div style={{ borderRadius: 12, overflow: "hidden" }}>{children}</div>
      </MagneticButton>
    </div>
  );
}
