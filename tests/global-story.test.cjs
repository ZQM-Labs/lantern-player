const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function element() {
  return {
    textContent: "",
    className: "",
    style: {},
    children: [],
    querySelector() { return null; },
    insertBefore(child) { this.children.push(child); },
    appendChild(child) { this.children.push(child); }
  };
}

test("GlobalStory initializes and applies a valid mode and culture", () => {
  const screens = {
    "screen-start": element(),
    "screen-finale": element(),
    "screen-map": element()
  };
  global.document = {
    readyState: "loading",
    addEventListener() {},
    getElementById(id) { return screens[id] || null; },
    createElement() { return element(); }
  };
  global.navigator = { language: "en-US" };
  global.pack = { stops: [{ id: 1 }], story_content: {}, environmental_storytelling: {} };
  global.state = { solved: [] };
  global.nextUnsolved = () => global.pack.stops[0];

  delete require.cache[require.resolve("../global-story.js")];
  const story = require("../global-story.js");
  assert.doesNotThrow(() => story.init());
  assert.equal(story.getCurrentMode(), "halloween");
  assert.equal(story.getCurrentCulture(), "western");
  assert.ok(story.adaptedStory);
  assert.equal(typeof story.adaptedStory.intro, "string");
});

test("service worker precaches the new player modules and available translation files", () => {
  const source = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  assert.match(source, /const CACHE = "lantern-v5"/);
  for (const asset of [
    "./global-story.js",
    "./i18n.js",
    "./i18n/en.json",
    "./i18n/es.json",
    "./i18n/fr.json",
    "./i18n/de.json",
    "./i18n/pt.json"
  ]) {
    assert.ok(source.includes(`"${asset}"`), `missing precache entry: ${asset}`);
  }
});

test("language picker lists only languages with translation files", () => {
  global.document = { readyState: "loading", addEventListener() {} };
  delete require.cache[require.resolve("../i18n.js")];
  const i18n = require("../i18n.js");
  const languages = Object.keys(i18n.languages);
  assert.deepEqual(languages.sort(), ["de", "en", "es", "fr", "pt"]);
  for (const language of languages) {
    assert.ok(fs.existsSync(path.join(root, "i18n", language + ".json")), `missing file for ${language}`);
  }
});
