// Minimal stand-in for node:assert/strict with what the tests use.

class AssertionError extends Error {}

const show = v => JSON.stringify(v);

function same(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => same(a[k], b[k]));
}

function ok(value, message) {
  if (!value) throw new AssertionError(message ?? `expected a truthy value: ${show(value)}`);
}

function equal(actual, expected, message) {
  if (!Object.is(actual, expected))
    throw new AssertionError(message ?? `${show(actual)} !== ${show(expected)}`);
}

function notEqual(actual, expected, message) {
  if (Object.is(actual, expected))
    throw new AssertionError(message ?? `expected a value other than ${show(expected)}`);
}

function deepEqual(actual, expected, message) {
  if (!same(actual, expected))
    throw new AssertionError(message ?? `${show(actual)} ≠ ${show(expected)}`);
}

export default { ok, equal, notEqual, deepEqual };
