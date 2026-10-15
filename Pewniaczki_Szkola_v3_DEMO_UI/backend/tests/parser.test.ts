import assert from "node:assert/strict";
import test from "node:test";
import { parseFeed } from "../src/services/parser";

test("poprawny rekord jest normalizowany", () => {
  const result = parseFeed({ events: [{
    idEvent: "100", strHomeTeam: "  Arsenal   FC ", strAwayTeam: " Chelsea ",
    strTimestamp: "2026-10-20T18:00:00+00:00", strVenue: "  Stadion "
  }] });
  assert.equal(result.received, 1);
  assert.equal(result.skipped, 0);
  assert.equal(result.events[0].externalId, "tsdb-100");
  assert.equal(result.events[0].home, "Arsenal FC");
  assert.equal(result.events[0].startAt.toISOString(), "2026-10-20T18:00:00.000Z");
});

test("pomija brakujace i zdublowane wydarzenia", () => {
  const record = { idEvent: "7", strHomeTeam: "A", strAwayTeam: "B", strTimestamp: "2026-11-03T19:00:00Z" };
  const result = parseFeed({ events: [record, record, { idEvent: "8", strHomeTeam: "A" }, null] });
  assert.equal(result.events.length, 1);
  assert.equal(result.skipped, 3);
});

test("null oznacza pusta liste", () => {
  assert.deepEqual(parseFeed({ events: null }), { events: [], received: 0, skipped: 0 });
});

test("bledny format odpowiedzi jest odrzucany", () => {
  assert.throws(() => parseFeed({ wrong: [] }), /Nieprawidłowa struktura/);
});
