/* Pack validation shared by the browser player and Node regression tests.
   Remote quest packs are untrusted input. Return validation errors; never throw
   for malformed JSON shapes or unexpected field types. */
(function (root) {
  "use strict";

  function nonEmptyText(value) {
    return (typeof value === "string" && value.trim() !== "") ||
      (typeof value === "number" && Number.isFinite(value));
  }

  function validatePack(pack) {
    const errors = [];
    if (!pack || typeof pack !== "object" || Array.isArray(pack)) {
      return ["pack must be an object"];
    }
    if (!Array.isArray(pack.stops) || pack.stops.length !== 6) {
      const got = !Array.isArray(pack.stops) ? typeof pack.stops : pack.stops.length;
      return ["expected 6 stops, got " + got];
    }

    const answers = [];
    const ids = [];
    pack.stops.forEach((stop, index) => {
      const tag = "stop " + (stop && typeof stop === "object" ? (stop.id ?? index + 1) : index + 1);
      if (!stop || typeof stop !== "object" || Array.isArray(stop)) {
        errors.push(tag + ": must be an object");
        return;
      }

      if (typeof stop.id !== "number" || !Number.isInteger(stop.id)) {
        errors.push(tag + ": id must be an integer");
      } else {
        ids.push(stop.id);
      }
      if (typeof stop.name !== "string" || !stop.name.trim() ||
          typeof stop.code !== "string" || !stop.code.trim()) {
        errors.push(tag + ": name + code must be non-empty strings");
      }
      if (!stop.story || typeof stop.story !== "object" ||
          typeof stop.story.cozy !== "string" || !stop.story.cozy.trim()) {
        errors.push(tag + ": story.cozy must be a non-empty string");
      }

      const puzzle = stop.puzzle && typeof stop.puzzle === "object" ? stop.puzzle.cozy : null;
      const questionOK = puzzle && nonEmptyText(puzzle.q);
      const answerOK = puzzle && nonEmptyText(puzzle.a);
      if (!questionOK || !answerOK) {
        errors.push(tag + ": puzzle.cozy needs a non-empty q + a");
      } else {
        answers.push(String(puzzle.a).trim().toLowerCase());
      }

      if (!stop.fallback || typeof stop.fallback !== "object" ||
          !nonEmptyText(stop.fallback.q) || !nonEmptyText(stop.fallback.a)) {
        errors.push(tag + ": fallback needs a non-empty q + a");
      }
      if (!Array.isArray(stop.hints) || stop.hints.length !== 3 ||
          stop.hints.some(hint => typeof hint !== "string" || !hint.trim())) {
        errors.push(tag + ": needs exactly 3 non-empty string hints");
      }

      if (typeof stop.lat !== "number" || !Number.isFinite(stop.lat) ||
          typeof stop.lng !== "number" || !Number.isFinite(stop.lng)) {
        errors.push(tag + ": lat/lng must be finite numbers");
      } else if (stop.lat < -90 || stop.lat > 90 || stop.lng < -180 || stop.lng > 180) {
        errors.push(tag + ": lat/lng out of geographic bounds");
      }

      if (stop.art !== undefined &&
          (typeof stop.art !== "string" ||
           !/^[A-Za-z0-9][A-Za-z0-9._-]*\.webp$/i.test(stop.art) ||
           stop.art.includes(".."))) {
        errors.push(tag + ": art must be a safe local WebP filename");
      }
    });

    if (new Set(answers).size !== answers.length) errors.push("cozy answers must be unique");
    if (new Set(ids).size !== ids.length) errors.push("stop ids must be unique");
    return errors;
  }

  root.PackValidation = { validatePack: validatePack };
  if (typeof module !== "undefined" && module.exports) module.exports = root.PackValidation;
})(typeof globalThis !== "undefined" ? globalThis : this);
