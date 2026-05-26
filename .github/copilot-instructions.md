# Copilot Instructions

## Solution Overview
MediaMonkey plugin suite (JavaScript + Jest tests, Visual Studio solution).

### Projects
- **Arnaud.MediaMonkeyPlugin.GeniusLyrics** – Plugin folder (not a .csproj). Deploy: zip `helpers/` + `info.json`, rename to `.mmip`.
  - `helpers/lyricsSearch_add.js` – sole source file. Defines `rGenius` (`LyricsSource`), registered via `window.lyricsSources.unshift(rGenius)`.
- **Arnaud.MediaMonkeyPlugin.Tests** – Jest test project (`npm install` + `npm test` in that folder).
  - `__tests__/moduleLoader.js` – loads source in a `vm` sandbox; exposes `rGenius`, `extractDivContent`, `formatGeniusSegment`, `window`, `stubs`.
  - `__tests__/lyricsSearch_add.test.js` – test suites: `extractDivContent`, `formatGeniusSegment`, `rGenius.formatArtist/formatTitle`, `rGenius metadata`, `rGenius.onSuccess`, `rGenius.onFailure`.

### Key Design Rules
- `formatURL` receives the already-substituted URL → do NOT strip chars there. Use `formatArtist` / `formatTitle` instead.
- Shared formatting logic → named `var formatGeniusSegment = function(s){...}` assigned to both `rGenius.formatArtist` and `rGenius.formatTitle`.
- `formatGeniusSegment`: collapse whitespace→`-`, remove `'`, remove `{()}$?.`, lowercase.
- `moduleLoader.js` must expose every named var (e.g. `formatGeniusSegment`) from the VM context for tests.
- Test style: detailed cases on the shared function; one smoke test each for `formatArtist` / `formatTitle`.

### Globals stubbed in tests
`window` (with `lyricsSources`), `LyricsSource`, `cleanupLyrics`, `whatNext`, `requestNext`.