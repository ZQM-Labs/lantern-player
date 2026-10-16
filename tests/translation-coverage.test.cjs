const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const languageCodes = ["de", "en", "es", "fr", "pt"];

test("only advertises languages with translation files", () => {
  const source = fs.readFileSync(path.join(root, "i18n.js"), "utf8");
  for (const code of languageCodes) {
    assert.ok(fs.existsSync(path.join(root, "i18n", code + ".json")), "missing " + code + ".json");
    assert.match(source, new RegExp("(^|\\n)\\s*" + code + ":\\s*\\{"));
  }
  assert.doesNotMatch(source, /\b(?:ar|it|ja|zh|ru):\s*\{/);
});

test("each advertised language has the same non-empty translation key set as English", () => {
  const english = JSON.parse(fs.readFileSync(path.join(root, "i18n/en.json"), "utf8"));
  const englishKeys = Object.keys(english).sort();
  assert.ok(englishKeys.length > 0, "English translation file must not be empty");

  for (const code of languageCodes) {
    const translations = JSON.parse(fs.readFileSync(path.join(root, "i18n", code + ".json"), "utf8"));
    assert.deepEqual(Object.keys(translations).sort(), englishKeys, code + " translation keys differ from English");
    for (const key of englishKeys) {
      assert.equal(typeof translations[key], "string", code + "." + key + " must be a string");
      assert.ok(translations[key].trim(), code + "." + key + " must not be empty");
    }
  }
});

test("player metadata does not claim more supported languages than the five shipped files", () => {
  const source = fs.readFileSync(path.join(root, "README.md"), "utf8");
  assert.doesNotMatch(source, /\b8 languages\b/i);
});
