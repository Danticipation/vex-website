/**
 * Dual clear-coat: primary Fresnel + secondary micro-Fresnel for depth (approximation).
 */
export const MULTI_LAYER_CLEAR_COAT = /* glsl */ `
  vec3 viewDirCC = normalize(-vViewPosition);
  vec3 nCC = normalize(normal);
  float NdotVcc = clamp(dot(nCC, viewDirCC), 0.0, 1.0);
  float f0 = pow(1.0 - NdotVcc, 1.25);
  float f1 = pow(1.0 - NdotVcc, 3.2);
  float coat = f0 * 0.55 + f1 * 0.35;
  outgoingLight *= (1.0 + uClearCoatIntensity * (0.04 + 0.09 * coat));
  outgoingLight += vec3(0.02 * f0 * uClearCoatIntensity);
`;
