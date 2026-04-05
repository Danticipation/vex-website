"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

export type ApexHeroOrchestration = {
  scrollY: MutableRefObject<number>;
  apexScrollBoost: number;
  apexScrollVelocity: MutableRefObject<number>;
  formationProgress: MutableRefObject<number>;
  burstFlashRef: MutableRefObject<number>;
  triggerBurstFlash: () => void;
};

/**
 * Scroll visibility → god-ray / bloom boost; velocity → speed streaks;
 * formation 0→1 on load; burst flash ref for CTA → particle sync.
 */
export function useApexHeroOrchestration(options: {
  apexMode: boolean;
  heroId?: string;
}): ApexHeroOrchestration {
  const { apexMode, heroId = "universe" } = options;
  const scrollY = useRef(0);
  const velocityRef = useRef(0);
  const [apexBoost, setApexBoost] = useState(0);
  const formationProgress = useRef(apexMode ? 0 : 1);
  const burstFlashRef = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(performance.now());

  const triggerBurstFlash = useCallback(() => {
    burstFlashRef.current = 1;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      scrollY.current = window.scrollY;
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastY.current);
      const dt = Math.max(0.001, (now - lastT.current) / 1000);
      const v = Math.min(1, dy / (dt * 9000));
      velocityRef.current = velocityRef.current * 0.88 + v * 0.12;
      lastY.current = window.scrollY;
      lastT.current = now;
      const hero = document.getElementById(heroId);
      if (!hero) return;
      const r = hero.getBoundingClientRect();
      const vh = window.innerHeight;
      const b = Math.max(0, Math.min(1, (vh - r.top) / (r.height + vh * 0.25)));
      setApexBoost((prev) => (Math.abs(prev - b) < 0.015 ? prev : b));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [heroId]);

  useEffect(() => {
    if (!apexMode) {
      formationProgress.current = 1;
      return;
    }
    formationProgress.current = 0;
    const start = performance.now();
    const dur = 1800;
    let id = 0;
    const run = () => {
      const t = (performance.now() - start) / dur;
      formationProgress.current = Math.min(1, t * t * (3 - 2 * t));
      if (t < 1) id = requestAnimationFrame(run);
    };
    id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
  }, [apexMode]);

  useEffect(() => {
    let id = 0;
    const decay = () => {
      burstFlashRef.current *= 0.91;
      id = requestAnimationFrame(decay);
    };
    id = requestAnimationFrame(decay);
    return () => cancelAnimationFrame(id);
  }, []);

  return {
    scrollY,
    apexScrollBoost: apexBoost,
    apexScrollVelocity: velocityRef,
    formationProgress,
    burstFlashRef,
    triggerBurstFlash,
  };
}
