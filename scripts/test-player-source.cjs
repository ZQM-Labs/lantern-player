"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");

const player = fs.readFileSync("app.js", "utf8");
const worker = fs.readFileSync("sw.js", "utf8");

assert.match(player, /const HINT_BUDGET = 18;/, "six stops should allow three hints per stop");
assert.match(
  player,
  /hintLevel = Math\.min\(3, Number\.isInteger\(state\.stopHints\[currentStop\.id\]\) \? state\.stopHints\[currentStop\.id\] : 0\)/,
  "reopening a stop should resume the consumed hint count"
);
assert.match(player, /state\.hintsUsed >= HINT_BUDGET/, "the global hint cap must be enforced");
assert.ok(player.includes('for (const tier of ["cozy", "spooky", "afterdark", "overdrive"])'), "all four scare levels must be validated for every stop");
for (const tier of ["spooky", "afterdark", "overdrive"]) {
  const variants = player.split(tier + ": { q:").length - 1;
  assert.ok(variants >= 6, tier + " must define a puzzle variant for all six stops");
}
assert.match(worker, /const CACHE = "lantern-v7";/, "the updated player must invalidate the previous app-shell cache");

console.log("Player source regression checks passed.");
