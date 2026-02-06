const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const config = require('../config');
const { getPuzzleById } = require('../services/puzzleService');

// Read game.html template once
const gameHtmlPath = path.join(__dirname, '..', '..', 'public', 'game.html');

router.get('/play/:puzzleId', (req, res) => {
    const puzzle = getPuzzleById(req.params.puzzleId);
    if (!puzzle) {
        return res.status(404).send('Puzzle not found');
    }

    // Read and inject the proper oEmbed discovery URL
    let html = fs.readFileSync(gameHtmlPath, 'utf-8');
    const pageUrl = encodeURIComponent(`${config.baseUrl}/play/${req.params.puzzleId}`);
    const oembedUrl = `${config.baseUrl}/oembed?url=${pageUrl}&format=json`;

    html = html.replace(
        '<link rel="alternate" type="application/json+oembed" href="/oembed" />',
        `<link rel="alternate" type="application/json+oembed" href="${oembedUrl}" />`
    );

    res.type('html').send(html);
});

module.exports = router;
