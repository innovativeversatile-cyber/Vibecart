/**
 * Unit tests: booking state machine (no DB).
 * Run: npm run test:bookings
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isAllowedBookingStatusTransition } = require("../booking-state-machine.js");

function test(name, fn) {
  try {
    fn();
    console.log("ok:", name);
  } catch (e) {
    console.error("fail:", name, e.message);
    process.exitCode = 1;
  }
}

test("noop same status", () => {
  const r = isAllowedBookingStatusTransition("pending", "pending");
  assert.equal(r.ok, true);
  assert.equal(r.noop, true);
});

test("pending to confirmed", () => {
  assert.equal(isAllowedBookingStatusTransition("pending", "confirmed").ok, true);
});

test("pending to declined", () => {
  assert.equal(isAllowedBookingStatusTransition("pending", "declined").ok, true);
});

test("confirmed to completed", () => {
  assert.equal(isAllowedBookingStatusTransition("confirmed", "completed").ok, true);
});

test("pending to completed forbidden", () => {
  assert.equal(isAllowedBookingStatusTransition("pending", "completed").ok, false);
});

test("declined to pending forbidden", () => {
  assert.equal(isAllowedBookingStatusTransition("declined", "pending").ok, false);
});

console.log("test-bookings done");
