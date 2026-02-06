const express = require('express');
const router = express.Router();
const { scanPuzzles, getPuzzleById } = require('../services/puzzleService');

router.get('/api/puzzles', (req, res) => {
    const puzzles = scanPuzzles();
    res.json(puzzles);
});

router.get('/api/puzzles/:id', (req, res) => {
    const puzzle = getPuzzleById(req.params.id);
    if (!puzzle) {
        return res.status(404).json({ error: 'Puzzle not found' });
    }
    res.json(puzzle);
});

module.exports = router;
