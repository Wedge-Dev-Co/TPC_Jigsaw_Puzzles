// Parse puzzle info from URL
const pathParts = window.location.pathname.split('/');
const puzzleId = pathParts[pathParts.length - 1];
const urlParams = new URLSearchParams(window.location.search);
const requestedPieces = parseInt(urlParams.get('pieces'), 10) || CONSTANTS.DEFAULT_PIECES;

// Find the closest valid grid size
const validCounts = Object.keys(CONSTANTS.GRID_SIZES).map(Number).sort((a, b) => a - b);
const pieceCount = validCounts.reduce((prev, curr) =>
    Math.abs(curr - requestedPieces) < Math.abs(prev - requestedPieces) ? curr : prev
);
const gridSize = CONSTANTS.GRID_SIZES[pieceCount];

// Shared game data accessible by all scenes
const GAME_DATA = {
    puzzleId: puzzleId,
    pieceCount: pieceCount,
    gridCols: gridSize.cols,
    gridRows: gridSize.rows,
    imageUrl: null,
    imageKey: 'puzzle-image'
};

// Fetch puzzle info from API, then start game
fetch(`/api/puzzles/${puzzleId}`)
    .then(res => res.json())
    .then(info => {
        GAME_DATA.imageUrl = info.imageUrl;
        GAME_DATA.title = info.title;
        startGame();
    })
    .catch(() => {
        document.body.innerHTML = '<p style="color:#ff6666;text-align:center;margin-top:40vh;font-size:20px;">Puzzle not found.</p>';
    });

function startGame() {
    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: window.innerWidth,
            height: window.innerHeight
        },
        backgroundColor: CONSTANTS.BG_COLOR,
        scene: [BootScene, MenuScene, PuzzleScene, WinScene]
    };

    const game = new Phaser.Game(config);
}
