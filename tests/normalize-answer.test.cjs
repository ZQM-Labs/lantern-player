// Answer-matching tests for normalizeAnswer() in app.js.
//
// Background (2026-10-21): the answer checker stripped case/punctuation
// but also removed spaces without tokenizing, so natural riddle answers
// failed — "a tree" became "atree", "the owl" became "theowl", "candles"
// kept its plural. Every text puzzle in the pack invites one of those
// forms; only the third hint (which states the bare key) rescued players.
// These tests pin the forgiving behavior by evaluating the REAL
// normalizeAnswer extracted from app.js (same slicing approach as
// tests/pack-validator.test.cjs).

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function loadNormalizeAnswer() {
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8").replace(/\r\n/g, "\n");
  const start = app.indexOf("function normalizeAnswer(s) {");
  assert.ok(start >= 0, "normalizeAnswer should exist in app.js");
  const end = app.indexOf("\n}\n", start);
  assert.ok(end > start, "normalizeAnswer should close");
  const factory = new Function(app.slice(start, end + 3) + "\nreturn normalizeAnswer;");
  return factory();
}

const normalizeAnswer = loadNormalizeAnswer();
const matches = (input, key) => normalizeAnswer(input) === normalizeAnswer(key);

test("exact, case, and punctuation variants match", () => {
  for (const [input, key] of [
    ["tree", "tree"], ["Tree", "tree"], ["TREE", "tree"],
    ["jack-o-lantern", "jack-o-lantern"], ["Jack O'Lantern!", "jack-o-lantern"],
    ["ho", "ho"], ["wisp", "wisp"], ["glass", "glass"],
  ]) assert.ok(matches(input, key), `"${input}" should match "${key}"`);
});

test("articles, honorifics, and plurals match the bare key", () => {
  for (const [input, key] of [
    ["a tree", "tree"], ["The Tree!", "tree"], ["trees", "tree"],
    ["an owl", "owl"], ["owls", "owl"],
    ["a coin", "coin"], ["coins", "coin"],
    ["spider", "spider"], ["spiders", "spider"], ["Mrs. Spider", "spider"],
    ["a candle", "candle"], ["candles", "candle"],
    ["an oak", "oak"], ["oaks", "oak"],
  ]) assert.ok(matches(input, key), `"${input}" should match "${key}"`);
});

test("numeric answers still match across separator styles", () => {
  for (const [input, key] of [
    ["42", "42"], ["4,015", "4015"], ["4015", "4015"], ["7.5", "7.5"], ["0", "0"],
  ]) assert.ok(matches(input, key), `"${input}" should match "${key}"`);
});

test("wrong answers still fail", () => {
  for (const [input, key] of [
    ["tree", "oak"], ["candle", "lantern"], ["", "tree"], ["the", "tree"],
    ["glas", "glass"], ["spider", "coin"], ["43", "42"],
  ]) assert.ok(!matches(input, key), `"${input}" should NOT match "${key}"`);
});
