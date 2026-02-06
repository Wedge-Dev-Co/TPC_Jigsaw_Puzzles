function corsAndFrameHeaders(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Allow embedding in iframes (remove X-Frame-Options restriction)
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "frame-ancestors *;");

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
}

module.exports = corsAndFrameHeaders;
