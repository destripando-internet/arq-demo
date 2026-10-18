// Minimal stand-in for node:test, to run the tests in the browser (see
// test-web/index.html).

const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export async function run() {
  const results = [];
  for (const { name, fn } of tests) {
    try {
      await fn();
      results.push({ name, ok: true });
    } catch (e) {
      results.push({ name, ok: false, error: e.message });
    }
  }
  return results;
}
