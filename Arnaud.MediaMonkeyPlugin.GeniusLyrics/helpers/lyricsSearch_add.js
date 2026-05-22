var rGenius = new LyricsSource();

function extractDivContent(html, start) {
    var depth = 1;
    var pos = start;
    while (pos < html.length && depth > 0) {
        var openIdx = html.indexOf('<div', pos);
        var closeIdx = html.indexOf('</div>', pos);
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
    var l = '';
    var p = '';
    try {
        var marker = 'data-lyrics-container="true"';
        var pos = 0;
        var idx;

        while ((idx = html.indexOf(marker, pos)) !== -1) {
            var start = html.indexOf('>', idx) + 1;
            var chunk = extractDivContent(html, start);

            // Verwijder SVG-elementen
            chunk = chunk.replace(/<svg[\s\S]*?<\/svg>/gi, '');

            // Witregel VOOR sectie-header, geen <br> erna
            chunk = chunk.replace(/(\[[^\]]+\])/g, '<br><br>$1');

            // Strip alle HTML-tags behalve <br>
            chunk = chunk.replace(/<(?!br\s*\/?>)[^>]+>/gi, '');

            var trimmed = chunk.trim();
            if (trimmed.length > 5) {
                l += trimmed + '<br><br>';
            }
            pos = start;
        }

        // Strip alles vóór de eerste sectie-header
        var firstHeader = l.indexOf('[');
        if (firstHeader > 0) {
            l = l.substring(firstHeader);
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
rGenius.formatURL = function (host) {
    return host.replace(/\s+/g, '-').replace(/\'+/g, '').replace(/[{()}]/g, '').replace(/'/g, '').toLowerCase();
};
window.lyricsSources.unshift(rGenius);