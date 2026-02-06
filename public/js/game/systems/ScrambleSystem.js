/**
 * ScrambleSystem randomly places pieces in the tray area.
 */
const ScrambleSystem = {

    /**
     * Scatter pieces within the tray area.
     * For 100+ pieces: uses a loose grid layout to prevent total overlap.
     * Under 100: random scatter.
     *
     * @param {Phaser.GameObjects.Sprite[]} pieces
     * @param {number} trayX - left edge of tray area
     * @param {number} trayY - top edge of tray area
     * @param {number} trayW - tray width
     * @param {number} trayH - tray height
     * @param {number} scale - piece scale factor
     */
    scatter(pieces, trayX, trayY, trayW, trayH, scale) {
        // Shuffle order for varied depth stacking
        const shuffled = [...pieces];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        if (pieces.length >= 100) {
            this._gridScatter(shuffled, trayX, trayY, trayW, trayH, scale);
        } else {
            this._randomScatter(shuffled, trayX, trayY, trayW, trayH);
        }
    },

    _randomScatter(shuffled, trayX, trayY, trayW, trayH) {
        const padding = 30;
        const minX = trayX + padding;
        const maxX = trayX + trayW - padding;
        const minY = trayY + padding;
        const maxY = trayY + trayH - padding;

        shuffled.forEach((piece, i) => {
            piece.x = minX + Math.random() * (maxX - minX);
            piece.y = minY + Math.random() * (maxY - minY);
            piece.setDepth(i + 1);
            piece.setData('defaultDepth', i + 1);
        });
    },

    _gridScatter(shuffled, trayX, trayY, trayW, trayH, scale) {
        const padding = 10;
        const usableW = trayW - padding * 2;
        const usableH = trayH - padding * 2;
        const count = shuffled.length;

        // Compute grid dimensions that roughly fill the tray area
        const aspect = usableW / usableH;
        const gridCols = Math.ceil(Math.sqrt(count * aspect));
        const gridRows = Math.ceil(count / gridCols);
        const cellW = usableW / gridCols;
        const cellH = usableH / gridRows;

        // Random offset jitter (fraction of cell size)
        const jitter = 0.25;

        shuffled.forEach((piece, i) => {
            const col = i % gridCols;
            const row = Math.floor(i / gridCols);
            const cx = trayX + padding + col * cellW + cellW / 2;
            const cy = trayY + padding + row * cellH + cellH / 2;
            piece.x = cx + (Math.random() - 0.5) * cellW * jitter;
            piece.y = cy + (Math.random() - 0.5) * cellH * jitter;
            piece.setDepth(i + 1);
            piece.setData('defaultDepth', i + 1);
        });
    }
};
