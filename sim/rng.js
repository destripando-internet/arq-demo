// Deterministic randomness: the same (seed, key) always gives the same value,
// so a random loss does not change when the simulation is run again.

export function chance(seed, key) {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 0x85ebca6b);
    h ^= h >>> 13;
  }
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
