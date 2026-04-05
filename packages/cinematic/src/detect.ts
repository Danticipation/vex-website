/** Feature-detect WebGPU (Chrome, Edge, Firefox Nightly, Safari TP). */
export function hasWebGPU(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { gpu?: unknown };
  return nav.gpu != null;
}
