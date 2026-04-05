/**
 * Thin-film iridescence: angle-dependent hue shift + view fresnel (flip-flop feel).
 */
/** Body paint: thin-film hue — inject inside a single `{ ... }` before `#include <output_fragment>`. */
export const IRIDESCENT_PAINT_LAYER = /* glsl */ `
  vec3 iridView = normalize(-vViewPosition);
  vec3 iridN = normalize(normal);
  float iridNV = clamp(dot(iridN, iridView), 0.0, 1.0);
  float iridFilm = pow(1.0 - iridNV, 0.78);
  float iridPhase = iridFilm * 6.2831853 * uIridescenceAngle + uCinematicTime * 0.62;
  vec3 hueShift = vec3(
    0.52 + 0.48 * cos(iridPhase),
    0.50 + 0.50 * cos(iridPhase + 2.094395),
    0.48 + 0.52 * cos(iridPhase + 4.18879)
  );
  outgoingLight += diffuseColor.rgb * hueShift * iridFilm * uIridescenceStrength * 0.26;
`;
