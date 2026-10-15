import test from "node:test";
import assert from "node:assert/strict";
import { demoProviders, demoValuesForEvent } from "../src/services/demoValues";

test("przykładowe wartości są deterministyczne i skończone", () => {
  const one = demoValuesForEvent(12);
  assert.deepEqual(one, demoValuesForEvent(12));
  assert.equal(one.length, demoProviders.length);
  for (const row of one) {
    assert.equal(row.values.length, 3);
    for (const value of row.values) assert.equal(Number.isFinite(value), true);
  }
});
