# lantern-player

<p align="center">
  <img src="docs/assets/wisps-lost-lanterns-readme-banner.svg" alt="Wisp's Lost Lanterns — a six-checkpoint story hunt from ZQM Labs" width="100%" />
</p>

<!-- ZQM-START -->
<p align="center">
  <strong>ZQM Labs — Z's Quests & Mischief</strong><br>
  <em>Games, gear & a little mischief.</em>
</p>
<!-- ZQM-END -->

The player web app (PWA) for ZQM Labs location games. Vanilla HTML/CSS/JS — no build step, no framework. Leaflet is the only library (vendor it locally before launch; CDN is fine for dev).

## Run locally

Serve the repository root over HTTP; opening `index.html` directly can break module loading and service-worker behavior.

## How it works

The player supports QR and GPS-based checkpoint flows, depending on the quest pack and device capabilities. Validate route coordinates, permissions, QR signage, accessibility, and safety at the actual venue before an event.

## Language support

The repository currently includes locale files for English, Spanish, French, German, and Portuguese. The language selector is experimental; the presence of locale files does not establish complete translation coverage for every story, pack, or UI state. Verify translation completeness before advertising language support.

## Content packs

Use the quest-pack schema and validator from the authoring resources. Malformed pack data should be rejected safely rather than crashing the player.

## Repository map

- `app.js` — player application
- `global-story.js` and `global-features.js` — story and feature modules
- `i18n.js` — locale selection and strings
- `sw.js` — service worker and offline cache
- `manifest.webmanifest` — installable PWA metadata
- `docs/assets/` — documentation-only artwork; not part of the runtime cache

<!-- ZQM-FOOTER-START -->
---
ZQM Labs · Z's Quests & Mischief
<!-- ZQM-FOOTER-END -->
