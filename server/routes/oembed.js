const express = require('express');
const router = express.Router();
const config = require('../config');

router.get('/oembed', (req, res) => {
    const { url, format } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing required "url" parameter' });
    }

    if (format && format !== 'json') {
        return res.status(501).json({ error: 'Only JSON format is supported' });
    }

    // Extract puzzle ID from the URL: /play/:puzzleId
    const urlObj = new URL(url, config.baseUrl);
    const match = urlObj.pathname.match(/^\/play\/([^/?]+)/);
    if (!match) {
        return res.status(404).json({ error: 'Invalid puzzle URL' });
    }

    const puzzleId = match[1];
    const pieces = urlObj.searchParams.get('pieces') || '25';
    const iframeSrc = `${config.baseUrl}/play/${puzzleId}?pieces=${pieces}`;

    res.json({
        version: '1.0',
        type: 'rich',
        provider_name: 'Teapot Commons',
        provider_url: config.baseUrl,
        title: `Jigsaw Puzzle - ${puzzleId.replace(/-/g, ' ')}`,
        width: 960,
        height: 640,
        html: `<iframe src="${iframeSrc}" width="960" height="640" frameborder="0" allowfullscreen></iframe>`
    });
});

module.exports = router;
