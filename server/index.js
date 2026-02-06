const express = require('express');
const path = require('path');
const config = require('./config');
const corsMiddleware = require('./middleware/cors');
const oembedRoutes = require('./routes/oembed');
const puzzleRoutes = require('./routes/puzzles');
const gameRoutes = require('./routes/game');

const app = express();

// Middleware
app.use(corsMiddleware);

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve puzzle images from puzzles/ directory at /images/
app.use('/images', express.static(path.join(__dirname, '..', 'puzzles')));

// Serve vendored libraries
app.use('/lib', express.static(path.join(__dirname, '..', 'lib')));

// Routes
app.use(oembedRoutes);
app.use(puzzleRoutes);
app.use(gameRoutes);

app.listen(config.port, () => {
    console.log(`TPC Jigsaw Puzzles running at ${config.baseUrl}`);
});
