let rGenius = new LyricsSource();

function extractDivContent(html, start) {
    let depth = 1;
    let pos = start;
    while (pos < html.length && depth > 0) {
        let openIdx = html.indexOf('<div', pos);
        let closeIdx = html.indexOf('</div>', pos);
        if (closeIdx === -1) break;
        if (openIdx !== -1 && openIdx < closeIdx) {
            depth++;
            pos = openIdx + 4;
        } else {
            depth--;
            pos = closeIdx + 6;
        }
    }
    return html.substring(start, pos);
}

rGenius.onSuccess = function (html, xml) {
    let l = '';
    let p = '';
    try {
        let marker = 'data-lyrics-container="true"';
        let pos = 0;
        let idx;

        while ((idx = html.indexOf(marker, pos)) !== -1) {
            let start = html.indexOf('>', idx) + 1;
            let chunk = extractDivContent(html, start);

            // Verwijder SVG-elementen
            chunk = chunk.replaceAll(/<svg[\s\S]*?<\/svg>/gi, '');

            // Witregel VOOR sectie-header, geen <br> erna
            chunk = chunk.replaceAll(/(\[[^\]]+\])/g, '<br><br>$1');

            // Strip alle HTML-tags behalve <br>
            chunk = chunk.replaceAll(/<(?!br\s*\/?>)[^>]+>/gi, '');

            let trimmed = chunk.trim();
            if (trimmed.length > 5) {
                l += trimmed + '<br><br>';
            }
            pos = start;
        }

        // Strip alles vóór de eerste sectie-header
        let firstHeader = l.indexOf('[');
        if (firstHeader > 0) {
            l = l.substring(firstHeader);
        } else if (firstHeader === -1) {
            // No section headers: strip Genius header preamble (e.g. "3 ContributorsDusk Lyrics")
            l = l.replace(/^\d+\s*Contributors[\s\S]*?Lyrics/i, '');
        }

        l = cleanupLyrics(l);
        if (l) p = 'genius.com';
    } catch (ex) {
        l = '';
    }
    whatNext(l, p);
};

rGenius.onFailure = function (err) {
    requestNext();
}
rGenius.host = 'https://genius.com/%artist%-%title%-lyrics';
rGenius.sendString = '';
rGenius.name = 'Genius';
function formatGeniusSegment(s) {
    return s.normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').replaceAll(/&/g, 'and').replaceAll(/\s+/g, '-').replaceAll(/['\u2018\u2019]+/g, '').replaceAll(/[{()}$?.,]/g, '').toLowerCase();
}
rGenius.formatArtist = formatGeniusSegment;
rGenius.formatTitle = formatGeniusSegment;
window.lyricsSources.unshift(rGenius);