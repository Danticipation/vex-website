/**
 * Procedural noise + metallic flake sparkle (FBM-style, 2 octaves).
 * Injected before the main body block; relies on `vUv` from MeshPhysicalMaterial.
 */
export const METALLIC_FLAKE_NOISE_HELPERS = /* glsl */ `
float vex_hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float vex_noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = vex_hash(i);
  float b = vex_hash(i + vec2(1.0, 0.0));
  float c = vex_hash(i + vec2(0.0, 1.0));
  float d = vex_hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float vex_fbm(vec2 p) {
  return vex_noise(p) * 0.55 + vex_noise(p * 2.18) * 0.32 + vex_noise(p * 4.37) * 0.13;
}
`;

export const METALLIC_FLAKE_LAYER = /* glsl */ `
  vec2 fuv = vUv * vec2(64.0, 64.0) * (0.5 + uFlakeDensity);
  vec2 scroll = vec2(uCinematicTime * 0.11, uCinematicTime * 0.07);
  float f = vex_fbm(fuv + scroll);
  float sparkle = pow(clamp(f, 0.0, 1.0), 18.0) * uFlakeDensity;
  vec3 flakeLight = normalize(vec3(0.35, 0.85, 0.4));
  vec3 flakeN = normalize(normal);
  float flakeNdotL = max(dot(flakeN, flakeLight), 0.0);
  outgoingLight += vec3(sparkle * (0.35 + 0.65 * flakeNdotL));
`;
