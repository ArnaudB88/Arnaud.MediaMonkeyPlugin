# Copilot Instructions

**Trust these instructions first.** They are validated against the current repo. Only search/explore if something here is missing or proven wrong by an actual error.

## Repository Summary
Small MediaMonkey plugin suite. The shipped product is **GeniusLyrics**, a JavaScript plugin that fetches and parses song lyrics from genius.com, plus a **Jest** unit-test project. Despite being a Visual Studio solution, there is **no C#/.NET, no compiled code, and no transpilation** — it is plain JavaScript (ES2021+, `replaceAll`, `String.normalize`). Total source is a handful of files.

## Tech Stack & Toolchain (validated versions)
- **Language:** JavaScript only. Plugin source is a single file: `Arnaud.MediaMonkeyPlugin.GeniusLyrics/helpers/lyricsSearch_add.js`.
- **Projects:** two SDK-style `.esproj` (`Microsoft.VisualStudio.JavaScript.Sdk/1.0.5171056`). These are VS containers only; they do **not** compile or bundle anything.
- **Tests:** Jest `^29.7.0` (`testEnvironment: node`).
- **Node:** v18+ required (validated working on v26.1.0); **npm** validated 11.13.0.
- **Shell:** Windows PowerShell 5.1 (`powershell.exe`). **`pwsh` (PowerShell 7) is NOT installed** — do not invoke scripts with `pwsh`. `build.ps1` is 5.1-compatible.
- **IDE:** Visual Studio 2026 (solution file is `Arnaud.MediaMonkeyPlugin.slnx`).

## Build, Test & Validate
There is **no CI** (`.github/workflows` is empty) and **no lint/format config** (no ESLint/Prettier/EditorConfig/tsconfig). Validation is local only: run the tests. Do all of the following from the indicated working directory.

### Run the unit tests (primary validation — do this for every code change)
```powershell
cd Arnaud.MediaMonkeyPlugin.Tests
npm install   # REQUIRED once before the first test run; node_modules is gitignored. Safe to repeat.
npm test      # runs jest
```
- **Always run `npm install` before the first `npm test`** in a fresh checkout, or Jest will not be found.
- Expected result: **2 test suites, 29 tests, all passing** (~0.5 s).
- **Known noise, NOT a failure:** Jest writes to stderr, so PowerShell wraps the output in a red `node.exe : ... NativeCommandError`. Judge success only by the `Test Suites: N passed` / `Tests: N passed` summary lines, never by the presence of red text. Exit code is 0 on success.
- **Offline safety:** `__tests__/lyricsSearch_add.parsing.test.js` reads cached HTML fixtures from `resources/*.html`. As long as those files exist (they do), tests run fully offline. **Do NOT delete `resources/*.html`** — if a fixture is missing, that test fetches from genius.com (30 s timeout) and will fail in a no-network environment.

### Package the plugin (only when producing a release artifact)
```powershell
# from the repository root
.\build.ps1
```
- Reads `version` from `Arnaud.MediaMonkeyPlugin.GeniusLyrics/info.json`, zips the `helpers/` folder + `info.json`, and writes `Arnaud.GeniusLyrics.v<version>.mmip` to the repo root. Validated: prints `Build complete: ...` and exits 0.
- The `.mmip` files are **untracked build artifacts** (not committed; not in `.gitignore`). Do not commit them and do not treat a stray `Arnaud.GeniusLyrics.v*.mmip` as a source change.
- To cut a new plugin version, bump `info.json` `version`, then run `build.ps1` (the version is embedded in the output filename and shipped to MediaMonkey).

### Test discovery vs. project files (important)
- Jest discovers tests via `testMatch: ['**/*.test.js']` in `jest.config.js`, **independent of** the `<Content>` lists in the `.esproj`. A new `*.test.js` file is picked up by `npm test` automatically.
- The `.esproj` `<Content>` entries only control Visual Studio's Solution Explorer / Test Explorer view. Note `lyricsSearch_add.parsing.test.js` is intentionally run by Jest but is not listed in the esproj. When adding a test file, add it to the esproj `<Content>` only if you want it visible in VS.

## Project Layout
```
/ (repo root)
├─ Arnaud.MediaMonkeyPlugin.slnx        # VS solution (references both .esproj + solution items)
├─ build.ps1                            # packages the plugin into a .mmip (Windows PowerShell 5.1)
├─ README.md                            # build/install/test instructions
├─ LICENSE
├─ Arnaud.GeniusLyrics.v1.0.4.mmip      # untracked prebuilt artifact (ignore for source work)
├─ .github/copilot-instructions.md      # this file (.github/workflows is EMPTY — no CI)
├─ Arnaud.MediaMonkeyPlugin.GeniusLyrics/
│  ├─ Arnaud.MediaMonkeyPlugin.GeniusLyrics.esproj
│  ├─ helpers/lyricsSearch_add.js       # THE plugin source — edit lyrics logic here
│  ├─ info.json                         # plugin manifest; `version` drives the .mmip filename
│  └─ package.json                      # metadata only (no scripts/deps)
└─ Arnaud.MediaMonkeyPlugin.Tests/
   ├─ Arnaud.MediaMonkeyPlugin.Tests.esproj
   ├─ jest.config.js                    # testEnvironment: node, testMatch **/*.test.js
   ├─ package.json                      # "test": "jest"; devDep jest ^29.7.0
   ├─ package-lock.json                 # source of truth for `npm install`
   ├─ .gitignore                        # node_modules/
   ├─ __tests__/
   │  ├─ moduleLoader.js                # loads source in a vm sandbox (NOT a test file)
   │  ├─ lyricsSearch_add.test.js       # unit tests (extractDivContent, formatGeniusSegment, metadata, onSuccess/onFailure)
   │  └─ lyricsSearch_add.parsing.test.js  # integration tests against cached genius.com HTML
   └─ resources/                        # *.html input fixtures + *.txt expected lyrics — DO NOT DELETE
```

## Source Architecture (`helpers/lyricsSearch_add.js`)
Runs in MediaMonkey's global scope; relies on host-provided globals (`LyricsSource`, `window`, `cleanupLyrics`, `whatNext`, `requestNext`). Key members:
- `let rGenius = new LyricsSource();` — registered via `window.lyricsSources.unshift(rGenius)` (must be the first source).
- `function extractDivContent(html, start)` — balanced `<div>` extractor used to grab the lyrics container.
- `rGenius.onSuccess(html, xml)` — locates `data-lyrics-container="true"`, extracts the div, removes `<svg>`, inserts `<br><br>` before each `[Section]` header, strips all tags except `<br>`, trims preamble, runs `cleanupLyrics`, then calls `whatNext(lyrics, provider)`.
- `rGenius.onFailure(err)` — calls `requestNext()`.
- `rGenius.host = 'https://genius.com/%artist%-%title%-lyrics'`, `rGenius.sendString = ''`, `rGenius.name = 'Genius'`.
- `function formatGeniusSegment(s)` — assigned to both `rGenius.formatArtist` and `rGenius.formatTitle`.

## Test Architecture
- `__tests__/moduleLoader.js` exposes `load(overrides)`, which runs the source in a Node `vm` context with stubbed globals: `window` (with `lyricsSources: []`), `LyricsSource` (empty ctor), `cleanupLyrics`, `whatNext`, `requestNext`. It returns `{ rGenius, extractDivContent, formatGeniusSegment, window, stubs }`.
- Top-level `function`/`var` declarations in the source become properties of the VM context, which is how `extractDivContent` and `formatGeniusSegment` are exposed. **Any new helper you want to unit-test must be a top-level declaration** so the loader can surface it.
- Tests inject behavior via `load({ cleanupLyrics, whatNext, requestNext })` overrides and assert on captured values.

## Design Rules (preserve these when editing)
- `formatURL` receives the already-substituted URL → do NOT strip characters there. Do all artist/title sanitizing in `formatArtist` / `formatTitle`.
- Keep one shared `formatGeniusSegment` function assigned to both `rGenius.formatArtist` and `rGenius.formatTitle`; do not duplicate logic.
- `formatGeniusSegment` current behavior: `normalize('NFD')` + strip diacritics (`[\u0300-\u036f]`), `&`→`and`, collapse whitespace→`-`, remove apostrophes (straight `'` and curly `\u2018\u2019`), remove `{ ( ) } $ ? . ,`, then `toLowerCase()`. Add new test cases here when changing it.
- Test style: detailed cases on `formatGeniusSegment`; one smoke test each for `formatArtist` / `formatTitle`.
