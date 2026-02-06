const fs = require('fs');
const path = require('path');
const config = require('../config');

const puzzlesDir = path.join(__dirname, '..', '..', 'puzzles');

function scanPuzzles() {
    if (!fs.existsSync(puzzlesDir)) {
        return [];
    }

    const files = fs.readdirSync(puzzlesDir);
    return files
        .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return config.supportedImageFormats.includes(ext);
        })
        .map(file => {
            const ext = path.extname(file);
            const id = path.basename(file, ext);
            return {
                id,
                filename: file,
                imageUrl: `/images/${file}`,
                title: id.replace(/[-_]/g, ' ')
            };
        });
}

function getPuzzleById(id) {
    const puzzles = scanPuzzles();
    return puzzles.find(p => p.id === id) || null;
}

module.exports = { scanPuzzles, getPuzzleById };
