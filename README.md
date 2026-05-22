# Arnaud.MediaMonkeyPlugin
Plugins for MediaMonkey

## Arnaud.MediaMonkeyPlugin.GeniusLyrics
A lyrics plugin for MediaMonkey that fetches lyrics from Genius.com.

### Build
- Zip the contents of the `Arnaud.MediaMonkeyPlugin` folder (not the folder itself):
  - helpers folder
  - info.json file 
- Rename the zip to `Arnaud.GeniusLyrics.vx.y.z.zip`.
- Change the extention to `.mmip`

### Install
- Double click the `Arnaud.GeniusLyrics.mmip` file and follow the installation instructions.

## Arnaud.MediaMonkeyPlugin.Tests
Unit tests for the JavaScript helper files, built with [Jest](https://jestjs.io/).

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)

### Setup
Install dependencies once before running tests:
```powershell
cd Arnaud.MediaMonkeyPlugin.Tests
npm install
```

### Running tests
**From the command line:**
```powershell
cd Arnaud.MediaMonkeyPlugin.Tests
npm test
```

**From Visual Studio Test Explorer:**
1. Open the solution in Visual Studio.
2. Run `npm install` in the `Arnaud.MediaMonkeyPlugin.Tests` folder (see Setup above).
3. Open **Test** > **Test Explorer**.
4. Click **Run All** or select individual tests to run.