'use strict';

const { load } = require('./moduleLoader');

// ---------------------------------------------------------------------------
// extractDivContent
// ---------------------------------------------------------------------------
describe('extractDivContent', () => {
  test('extracts content inside a single flat div', () => {
    const { extractDivContent } = load();
    const html = '<div>Hello world</div>';
    // start = index after the first '>'  => 5
    const start = html.indexOf('>') + 1;
    const result = extractDivContent(html, start);
    expect(result).toBe('Hello world');
  });

  test('handles nested divs correctly', () => {
    const { extractDivContent } = load();
    const html = '<div><div>inner</div> outer</div>';
    const start = html.indexOf('>') + 1;
    const result = extractDivContent(html, start);
    expect(result).toBe('<div>inner</div> outer');
  });

  test('returns content up to unmatched close when no open tag', () => {
    const { extractDivContent } = load();
    // No nested divs – just text followed by a closing div
    const html = 'some text</div>rest';
    const result = extractDivContent(html, 0);
    expect(result).toBe('some text');
  });
});

// ---------------------------------------------------------------------------
// formatURL
// ---------------------------------------------------------------------------
describe('rGenius.formatURL', () => {
  let rGenius;

  beforeEach(() => {
    ({ rGenius } = load());
  });

  test('replaces spaces with hyphens', () => {
    expect(rGenius.formatURL('Hello World')).toBe('hello-world');
  });

  test('removes apostrophes (straight and curly)', () => {
    expect(rGenius.formatURL("it's alive")).toBe('its-alive');
    expect(rGenius.formatURL('it\u2019s alive')).toBe('its-alive');
  });

  test('removes parentheses and curly braces', () => {
    expect(rGenius.formatURL('song (live) {version}')).toBe('song-live-version');
  });

  test('converts to lowercase', () => {
    expect(rGenius.formatURL('HELLO')).toBe('hello');
  });

  test('collapses multiple spaces into multiple hyphens', () => {
    expect(rGenius.formatURL('a  b')).toBe('a--b');
  });
});

// ---------------------------------------------------------------------------
// rGenius metadata
// ---------------------------------------------------------------------------
describe('rGenius metadata', () => {
  test('is registered as the first lyrics source', () => {
    const { window } = load();
    expect(window.lyricsSources.length).toBeGreaterThan(0);
    expect(window.lyricsSources[0].name).toBe('Genius');
  });

  test('has the expected host template', () => {
    const { rGenius } = load();
    expect(rGenius.host).toBe('https://genius.com/%artist%-%title%-lyrics');
  });

  test('has an empty sendString', () => {
    const { rGenius } = load();
    expect(rGenius.sendString).toBe('');
  });
});

// ---------------------------------------------------------------------------
// onSuccess – lyrics parsing
// ---------------------------------------------------------------------------
describe('rGenius.onSuccess', () => {
  function buildHtml(innerContent) {
    return `<div data-lyrics-container="true">${innerContent}</div>`;
  }

  function runOnSuccess(html, cleanupOverride) {
    let capturedLyrics;
    let capturedProvider;

    const { rGenius } = load({
      cleanupLyrics: cleanupOverride || ((l) => l),
      whatNext: (l, p) => {
        capturedLyrics = l;
        capturedProvider = p;
      },
    });

    rGenius.onSuccess(html, null);
    return { lyrics: capturedLyrics, provider: capturedProvider };
  }

  test('extracts plain text lyrics', () => {
    const html = buildHtml('[Verse 1]<br/>Hello world');
    const { lyrics, provider } = runOnSuccess(html);
    expect(lyrics).toContain('[Verse 1]');
    expect(lyrics).toContain('Hello world');
    expect(provider).toBe('genius.com');
  });

  test('strips HTML tags other than <br>', () => {
    const html = buildHtml('[Chorus]<br/><a href="#">Some link</a> lyric');
    const { lyrics } = runOnSuccess(html);
    expect(lyrics).not.toMatch(/<a /);
    expect(lyrics).toContain('Some link');
  });

  test('removes SVG elements', () => {
    const html = buildHtml('[Verse]<svg><path d="M0 0"/></svg><br/>No SVG here');
    const { lyrics } = runOnSuccess(html);
    expect(lyrics).not.toContain('<svg');
    expect(lyrics).not.toContain('<path');
  });

  test('adds blank line before section headers', () => {
    const html = buildHtml('[Verse 1]<br/>Line one<br/>[Chorus]<br/>Line two');
    const { lyrics } = runOnSuccess(html);
    // The regex inserts <br><br> before every [Header]
    const verseIdx = lyrics.indexOf('[Verse 1]');
    const chorusIdx = lyrics.indexOf('[Chorus]');
    expect(verseIdx).toBeGreaterThanOrEqual(0);
    expect(chorusIdx).toBeGreaterThan(verseIdx);
  });

  test('sets provider to empty string when no lyrics container found', () => {
    const { lyrics, provider } = runOnSuccess('<html><body>no lyrics here</body></html>');
    expect(lyrics).toBeFalsy();
    expect(provider).toBe('');
  });

  test('passes lyrics through cleanupLyrics', () => {
    const html = buildHtml('[Verse 1]<br/>Raw text');
    const { lyrics } = runOnSuccess(html, (l) => l.replace('Raw text', 'CLEANED'));
    expect(lyrics).toContain('CLEANED');
  });

  test('calls whatNext with empty strings on exception', () => {
    let capturedLyrics;
    const { rGenius } = load({
      cleanupLyrics: () => { throw new Error('boom'); },
      whatNext: (l) => { capturedLyrics = l; },
    });
    // Should not throw; onSuccess catches internally
    expect(() => rGenius.onSuccess(buildHtml('[V]<br/>hi'), null)).not.toThrow();
    expect(capturedLyrics).toBe('');
  });
});

// ---------------------------------------------------------------------------
// onFailure
// ---------------------------------------------------------------------------
describe('rGenius.onFailure', () => {
  test('calls requestNext', () => {
    const requestNext = jest.fn();
    const { rGenius } = load({ requestNext });
    rGenius.onFailure(new Error('network error'));
    expect(requestNext).toHaveBeenCalledTimes(1);
  });
});
