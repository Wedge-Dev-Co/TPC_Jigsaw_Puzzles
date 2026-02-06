/**
 * ScrambleSystem randomly places pieces in the tray area.
 */
const ScrambleSystem = {

    /**
     * Scatter pieces randomly within the tray area.
     *
     * @param {Phaser.GameObjects.Sprite[]} pieces
     * @param {number} trayX - left edge of tray area
     * @param {number} trayY - top edge of tray area
     * @param {number} trayW - tray width
     * @param {number} trayH - tray height
     * @param {number} scale - piece scale factor
     */
    scatter(pieces, trayX, trayY, trayW, trayH, scale) {
        const padding = 30;
        const minX = trayX + padding;
        const maxX = trayX + trayW - padding;
        const minY = trayY + padding;
        const maxY = trayY + trayH - padding;

        // Shuffle order for varied depth stacking
        const shuffled = [...pieces];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        shuffled.forEach((piece, i) => {
            piece.x = minX + Math.random() * (maxX - minX);
            piece.y = minY + Math.random() * (maxY - minY);
            piece.setDepth(i + 1);
            piece.setData('defaultDepth', i + 1);
        });
    }
};
