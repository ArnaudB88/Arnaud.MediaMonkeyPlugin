'use strict';

/**
 * Loads lyricsSearch_add.js in a controlled environment where all
 * MediaMonkey globals are stubbed out, then exposes the pieces we
 * want to test.
 *
 * Call `load(overrides)` to get a fresh module instance with optional
 * stub overrides (e.g. to spy on `whatNext` or `cleanupLyrics`).
 */
function load(overrides = {}) {
  // Stubs that satisfy the dependencies used at module level
  const lyricsSources = [];

  const defaults = {
    cleanupLyrics: (l) => l,
    whatNext: () => {},
    requestNext: () => {},
  };

  const stubs = { ...defaults, ...overrides };

  // Build a minimal `window` with lyricsSources
  const fakeWindow = { lyricsSources };

  // Run the source file in a sandboxed VM context
  const vm = require('vm');
  const fs = require('fs');
  const path = require('path');

  const src = fs.readFileSync(
    path.resolve(__dirname, '../../Arnaud.MediaMonkeyPlugin.GeniusLyrics/helpers/lyricsSearch_add.js'),
    'utf8'
  );

  const context = vm.createContext({
    window: fakeWindow,
    LyricsSource: function LyricsSource() {},
    cleanupLyrics: stubs.cleanupLyrics,
    whatNext: stubs.whatNext,
    requestNext: stubs.requestNext,
    // extractDivContent is declared with `function` so it becomes a
    // property of the context after the script runs.
  });

  vm.runInContext(src, context);

  return {
    /** The rGenius object created by the script */
    rGenius: fakeWindow.lyricsSources[0],
    /** extractDivContent exposed from the context */
    extractDivContent: context.extractDivContent,
    /** formatGeniusSegment exposed from the context */
    formatGeniusSegment: context.formatGeniusSegment,
    /** The window stub (gives access to lyricsSources) */
    window: fakeWindow,
    /** The stubs so tests can assert on them */
    stubs,
  };
}

module.exports = { load };
