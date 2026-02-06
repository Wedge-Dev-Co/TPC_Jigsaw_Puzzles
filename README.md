# TPC Jigsaw Puzzles

A web-based jigsaw puzzle game built for [Teapot Commons](https://www.teapot-commons.com). Players drag and drop jigsaw-cut pieces to assemble an image, with five difficulty levels from 9 to 49 pieces. Designed for embedding in WordPress via the oEmbed protocol.

## Features

- **Client-side piece cutting** -- Images are sliced into interlocking jigsaw shapes using Bezier curves and canvas clipping, with no server-side image processing required
- **Drag and drop gameplay** -- Pick up, move, and snap pieces into place with mouse or touch input
- **Five difficulty levels** -- 3x3, 4x4, 5x5, 6x6, and 7x7 grids (9 to 49 pieces)
- **oEmbed support** -- Embeds directly into WordPress and other oEmbed consumers via a standard discovery endpoint
- **Zero-config puzzle management** -- Drop an image file into the `puzzles/` directory and it becomes a playable puzzle immediately
- **No build step** -- Vanilla JavaScript with vendored Phaser 3. No bundler, no transpiler, no framework CLI

## Getting Started

### Prerequisites

- Node.js 18+

### Install and Run

```bash
git clone https://github.com/Wedge-Dev-Co/TPC_Jigsaw_Puzzles.git
cd TPC_Jigsaw_Puzzles
npm install
npm start
```

The server starts at `http://localhost:3000`.

### Configuration

Copy `.env.example` to `.env` and edit as needed:

```
PORT=3000
BASE_URL=http://localhost:3000
```

Set `BASE_URL` to your public-facing URL in production. This is used to generate correct oEmbed response URLs.

## Adding Puzzles

Drop image files into the `puzzles/` directory. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`.

The filename (without extension) becomes the puzzle ID and display title:

| File | Puzzle ID | Title |
|------|-----------|-------|
| `mountain-lake.jpg` | `mountain-lake` | mountain lake |
| `sunset_beach.png` | `sunset_beach` | sunset beach |

No restart required -- new images appear in the API and menu immediately.

**Recommended image size:** 800x600 to 1920x1080 pixels, landscape orientation.

## Usage

### Browser

- **Landing page** -- `http://localhost:3000` -- Browse all available puzzles
- **Play directly** -- `http://localhost:3000/play/{puzzle-id}?pieces=25` -- Jump into a specific puzzle at a given difficulty

### oEmbed Embedding

WordPress (and other oEmbed consumers) can discover and embed puzzles automatically. The game page includes a standard `<link rel="alternate">` discovery tag, and the server exposes a JSON endpoint:

```
GET /oembed?url=https://yoursite.com/play/mountain-lake&format=json
```

Returns:

```json
{
  "version": "1.0",
  "type": "rich",
  "provider_name": "Teapot Commons",
  "title": "Jigsaw Puzzle - mountain lake",
  "width": 960,
  "height": 640,
  "html": "<iframe src=\"https://yoursite.com/play/mountain-lake?pieces=25\" ...></iframe>"
}
```

### API

| Endpoint | Description |
|----------|-------------|
| `GET /api/puzzles` | List all available puzzles |
| `GET /api/puzzles/:id` | Get details for a single puzzle |
| `GET /oembed?url=...&format=json` | oEmbed endpoint |
| `GET /play/:puzzleId` | Game page (serves the Phaser app) |
| `GET /images/:filename` | Puzzle image files |

## Project Structure

```
TPC_Jigsaw_Puzzles/
├── server/
│   ├── index.js                 # Express entry point
│   ├── config.js                # Port, base URL, supported formats
│   ├── middleware/
│   │   └── cors.js              # CORS + iframe embedding headers
│   ├── routes/
│   │   ├── oembed.js            # oEmbed JSON endpoint
│   │   ├── puzzles.js           # Puzzle catalog API
│   │   └── game.js              # Game page route (injects oEmbed link)
│   └── services/
│       └── puzzleService.js     # Scans puzzles/ directory
├── public/
│   ├── index.html               # Landing page / puzzle browser
│   ├── game.html                # Phaser game page
│   ├── css/
│   │   ├── main.css
│   │   └── game.css
│   └── js/game/
│       ├── main.js              # Phaser config + game initialization
│       ├── scenes/
│       │   ├── BootScene.js     # Asset preloading + loading bar
│       │   ├── MenuScene.js     # Difficulty picker + image preview
│       │   ├── PuzzleScene.js   # Core gameplay
│       │   └── WinScene.js      # Victory screen
│       ├── systems/
│       │   ├── PieceCutter.js   # Edge map + Bezier jigsaw paths
│       │   ├── PieceFactory.js  # Canvas clipping -> Phaser textures
│       │   ├── SnapSystem.js    # Snap-to-position detection
│       │   └── ScrambleSystem.js
│       └── utils/
│           └── constants.js
├── puzzles/                     # Drop images here
└── lib/
    └── phaser.min.js            # Vendored Phaser 3.80.1
```

## Tech Stack

- **Frontend:** [Phaser 3](https://phaser.io/) (vendored), vanilla JavaScript
- **Backend:** [Express](https://expressjs.com/) 4
- **Embedding:** oEmbed 1.0 (rich type)

## License

ISC
