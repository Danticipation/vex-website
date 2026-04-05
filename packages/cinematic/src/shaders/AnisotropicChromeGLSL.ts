/**
 * Brushed / stretched specular for chrome & wheels (anisotropic-style without requiring tangents).
 */
export const ANISOTROPIC_CHROME_LAYER = /* glsl */ `
  vec3 viewDirA = normalize(-vViewPosition);
  vec3 nA = normalize(normal);
  vec3 upA = vec3(0.0, 1.0, 0.0);
  vec3 tA = normalize(cross(nA, upA));
  if (length(tA) < 0.01) tA = normalize(cross(nA, vec3(1.0, 0.0, 0.0)));
  float along = abs(dot(normalize(tA), viewDirA));
  float across = abs(dot(normalize(cross(nA, tA)), viewDirA));
  float stretch = mix(0.28, 1.0, pow(along, 1.8));
  float rim = mix(0.35, 1.0, pow(across, 0.9));
  float nvA = max(dot(nA, viewDirA), 0.0);
  float fresA = pow(1.0 - nvA, 0.42);
  outgoingLight += vec3(0.14 * fresA * stretch * rim * uAnisotropicChrome);
  outgoingLight += vec3(0.04 * sin(uCinematicTime * 0.4 + along * 12.0) * uAnisotropicChrome);
`;
