'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { load } = require('./moduleLoader');

const GENIUS_URL = 'https://genius.com/August-burns-red-martyr-lyrics';
const FIXTURE_PATH = path.resolve(__dirname, '../resources/August-burns-red-martyr-lyrics.html');

/**
 * Fetches the raw HTML of a URL, following up to one redirect.
 */
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    };

    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Returns the HTML for the Genius page, using a local fixture cache when available.
 * Fetches from the network and saves the fixture on first run.
 */
async function getHtml() {
  if (fs.existsSync(FIXTURE_PATH)) {
    return fs.readFileSync(FIXTURE_PATH, 'utf8');
  }
  const html = await fetchHtml(GENIUS_URL);
  fs.writeFileSync(FIXTURE_PATH, html, 'utf8');
  return html;
}

/**
 * Runs rGenius.onSuccess over the given HTML and returns the cleaned lyrics string.
 * <br> / <br/> tags are converted to newlines by cleanupLyrics.
 */
function parseLyrics(html) {
  let capturedLyrics = '';

  const { rGenius } = load({
    cleanupLyrics: (l) => l
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    whatNext: (l) => { capturedLyrics = l; },
  });

  rGenius.onSuccess(html, null);
  return capturedLyrics;
}

// ---------------------------------------------------------------------------
// Integration test – Genius.com HTML (cached fixture after first fetch)
// ---------------------------------------------------------------------------
describe('rGenius.onSuccess – real Genius.com HTML (August Burns Red – Martyr)', () => {
  let lyrics;

  beforeAll(async () => {
    const html = await getHtml();
    lyrics = parseLyrics(html);
  }, 30_000);

  test('parses all lyric sections from the Genius page', () => {
    const expectedLyrics = fs
      .readFileSync(path.resolve(__dirname, '../resources/August-burns-red-martyr-lyrics.txt'), 'utf8')
      .replace(/\r\n/g, '\n')
      .trim();

    expect(lyrics).toBe(expectedLyrics);
  });
});
