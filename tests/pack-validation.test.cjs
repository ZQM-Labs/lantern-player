const test = require("node:test");
const assert = require("node:assert/strict");
const { validatePack } = require("../pack-validation.js");

function validPack() {
  return {
    title: "Test hunt",
    stops: Array.from({ length: 6 }, (_, index) => ({
      id: index + 1,
      name: "Stop " + (index + 1),
      code: "CODE-" + (index + 1),
      lat: 29 + index / 100,
      lng: -80 - index / 100,
      art: "stop-" + (index + 1) + ".webp",
      story: { cozy: "A short story for stop " + (index + 1) },
      puzzle: { cozy: { q: "Question " + (index + 1) + "?", a: "answer-" + (index + 1) } },
      fallback: { q: "Fallback question?", a: "fallback-" + (index + 1) },
      hints: ["First hint", "Second hint", "Third hint"]
    }))
  };
}

test("accepts a structurally valid six-stop pack", () => {
  assert.deepEqual(validatePack(validPack()), []);
});

test("rejects absent, non-object, and wrong-length packs without throwing", () => {
  for (const candidate of [null, undefined, "pack", [], {}, { stops: "six" }, { stops: [] }]) {
    assert.doesNotThrow(() => validatePack(candidate));
    assert.ok(validatePack(candidate).length > 0);
  }
});

test("rejects null, primitive, and array stop entries without throwing", () => {
  for (const badStop of [null, undefined, "stop", 7, []]) {
    const pack = validPack();
    pack.stops[2] = badStop;
    assert.doesNotThrow(() => validatePack(pack));
    assert.ok(validatePack(pack).some(error => error.includes("must be an object")));
  }
});

test("rejects non-finite and out-of-range coordinates", () => {
  for (const [lat, lng, expected] of [
    [NaN, 0, "finite numbers"],
    [0, Infinity, "finite numbers"],
    [91, 0, "out of geographic bounds"],
    [0, -181, "out of geographic bounds"]
  ]) {
    const pack = validPack();
    pack.stops[0].lat = lat;
    pack.stops[0].lng = lng;
    assert.ok(validatePack(pack).some(error => error.includes(expected)));
  }
});

test("rejects malformed required fields, unsafe artwork, bad hints, and duplicate IDs/answers", () => {
  const pack = validPack();
  pack.stops[0].name = { injected: true };
  pack.stops[0].code = 9;
  pack.stops[0].art = "../secret.webp";
  pack.stops[0].hints = ["one", 2, ""];
  pack.stops[1].id = pack.stops[0].id;
  pack.stops[1].puzzle.cozy.a = pack.stops[0].puzzle.cozy.a;
  const errors = validatePack(pack);
  assert.ok(errors.some(error => error.includes("name + code")));
  assert.ok(errors.some(error => error.includes("safe local WebP")));
  assert.ok(errors.some(error => error.includes("hints")));
  assert.ok(errors.includes("stop ids must be unique"));
  assert.ok(errors.includes("cozy answers must be unique"));
});

test("rejects non-object puzzle/story/fallback fields without throwing", () => {
  const pack = validPack();
  pack.stops[0].story = "not an object";
  pack.stops[1].puzzle = "not an object";
  pack.stops[2].fallback = null;
  assert.doesNotThrow(() => validatePack(pack));
  const errors = validatePack(pack);
  assert.ok(errors.some(error => error.includes("story.cozy")));
  assert.ok(errors.some(error => error.includes("puzzle.cozy")));
  assert.ok(errors.some(error => error.includes("fallback")));
});
