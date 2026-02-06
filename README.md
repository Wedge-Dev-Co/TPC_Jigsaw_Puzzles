# TPC Jigsaw Puzzles

A web-based jigsaw puzzle game built for [Teapot Commons](https://www.teapot-commons.com). Players drag and drop jigsaw-cut pieces to assemble an image, with six difficulty levels from 9 to 500 pieces. Designed for embedding in WordPress, Squarespace, and other platforms via the oEmbed protocol.

## Features

- **Client-side piece cutting** -- Images are sliced into interlocking jigsaw shapes using Bezier curves and canvas clipping, with no server-side image processing required
- **6 shape variants** -- Each edge gets one of six distinct Bezier tab profiles (standard, wide, narrow-tall, lean-left, lean-right, squat) for visual variety while fitting seamlessly together
- **Group snapping** -- Adjacent pieces snap together anywhere on screen and move as a unit. Groups chain-snap when brought near other matching groups, and board-snap the entire group at once
- **Drag and drop gameplay** -- Pick up, move, and snap pieces into place with mouse or touch input
- **Six difficulty levels** -- 3x3, 4x4, 5x5, 6x6, 7x7, and 25x20 grids (9 to 500 pieces)
- **Image upload** -- Upload your own images from the landing page to create custom puzzles (10MB max, JPG/PNG/WebP)
- **Reference image overlay** -- Toggle a full-screen reference image with the "Show Image" button or the `R` key
- **500-piece support** -- Async batched piece creation with progress overlay, dynamic snap threshold, and grid-based scatter for large puzzles
- **oEmbed support** -- Embeds directly into WordPress, Squarespace, and other oEmbed consumers via a standard discovery endpoint
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

### Via the Web Interface

Click the upload form on the landing page, select an image, and click "Upload & Play." The image is saved to the `puzzles/` directory automatically and you're redirected to play it.

### Via the Filesystem

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

- **Landing page** -- `http://localhost:3000` -- Browse all available puzzles and upload new images
- **Play directly** -- `http://localhost:3000/play/{puzzle-id}?pieces=25` -- Jump into a specific puzzle at a given difficulty

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Toggle reference image overlay |

### Embedding

The game supports iframe embedding on any website. The server sets permissive `Content-Security-Policy: frame-ancestors *` and CORS headers.

**Direct iframe:**

```html
<iframe src="https://your-puzzle-server.com/play/mountain-lake?pieces=25"
        width="960" height="640" frameborder="0"
        allow="fullscreen"></iframe>
```

**oEmbed (WordPress, Ghost, etc.):**

WordPress and other oEmbed consumers can discover and embed puzzles automatically. The game page includes a standard `<link rel="alternate">` discovery tag, and the server exposes a JSON endpoint:

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

**Squarespace:**

Add a Code Block or Embed Block to any page and paste the iframe HTML above.

### API

| Endpoint | Description |
|----------|-------------|
| `GET /api/puzzles` | List all available puzzles |
| `GET /api/puzzles/:id` | Get details for a single puzzle |
| `POST /api/upload` | Upload a new puzzle image (multipart form, field: `image`) |
| `GET /oembed?url=...&format=json` | oEmbed endpoint |
| `GET /play/:puzzleId` | Game page (serves the Phaser app) |
| `GET /images/:filename` | Puzzle image files |

## Project Structure

```
TPC_Jigsaw_Puzzles/
├── server/
│   ├── index.js                 # Express entry point
│   ├── config.js                # Port, base URL, supported formats, upload limits
│   ├── middleware/
│   │   └── cors.js              # CORS + iframe embedding headers
│   ├── routes/
│   │   ├── oembed.js            # oEmbed JSON endpoint
│   │   ├── puzzles.js           # Puzzle catalog API
│   │   ├── game.js              # Game page route (injects oEmbed link)
│   │   └── upload.js            # Image upload endpoint (multer)
│   └── services/
│       └── puzzleService.js     # Scans puzzles/ directory
├── public/
│   ├── index.html               # Landing page / puzzle browser / upload form
│   ├── game.html                # Phaser game page
│   ├── css/
│   │   ├── main.css
│   │   └── game.css
│   └── js/game/
│       ├── main.js              # Phaser config + game initialization
│       ├── scenes/
│       │   ├── BootScene.js     # Asset preloading + loading bar
│       │   ├── MenuScene.js     # Difficulty picker + image preview
│       │   ├── PuzzleScene.js   # Core gameplay (group drag, async loading)
│       │   └── WinScene.js      # Victory screen
│       ├── systems/
│       │   ├── PieceCutter.js   # Edge map + 6 Bezier shape variants
│       │   ├── PieceFactory.js  # Canvas clipping -> Phaser textures (sync + async)
│       │   ├── SnapSystem.js    # Group snapping (neighbor + board)
│       │   └── ScrambleSystem.js # Tray scatter (random + grid-based)
│       └── utils/
│           └── constants.js
├── puzzles/                     # Drop images here (or upload via web)
└── lib/
    └── phaser.min.js            # Vendored Phaser 3.80.1
```

## Tech Stack

- **Frontend:** [Phaser 3](https://phaser.io/) (vendored), vanilla JavaScript
- **Backend:** [Express](https://expressjs.com/) 4, [multer](https://github.com/expressjs/multer) (uploads)
- **Embedding:** oEmbed 1.0 (rich type), iframe with permissive CORS

## License

ISC
