export function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function back(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** Position (0..100 %) along the square perimeter for a phase t in [0,1). */
export function perimXY(t: number): [number, number] {
  t = ((t % 1) + 1) % 1;
  const u = t * 4;
  if (u < 1) return [u * 100, 0];
  if (u < 2) return [100, (u - 1) * 100];
  if (u < 3) return [(3 - u) * 100, 100];
  return [0, (4 - u) * 100];
}
