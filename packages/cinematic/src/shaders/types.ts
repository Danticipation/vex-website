/** Live uniforms for hero / configurator / tenant JSON → runtime. */
export type CinematicPaintUniforms = {
  flakeDensity: number;
  iridescenceStrength: number;
  clearCoatIntensity: number;
  anisotropicChrome: number;
  /** Thin-film phase scale — higher = faster hue cycling across curvature */
  iridescenceAngle: number;
};

export const DEFAULT_CINEMATIC_UNIFORMS: CinematicPaintUniforms = {
  flakeDensity: 0.85,
  iridescenceStrength: 0.55,
  clearCoatIntensity: 1,
  anisotropicChrome: 0.72,
  iridescenceAngle: 1,
};
