/**
 * SnapSystem handles snapping pieces to their correct positions.
 */
const SnapSystem = {

    /**
     * Check if a piece is close enough to its correct position and snap it.
     *
     * @param {Phaser.GameObjects.Sprite} piece
     * @param {object} gameData - GAME_DATA
     * @param {number} threshold - snap distance in pixels
     * @returns {boolean} whether the piece was snapped
     */
    trySnap(piece, gameData, threshold) {
        if (piece.getData('snapped')) return true;

        const correctX = piece.getData('correctX');
        const correctY = piece.getData('correctY');
        const dx = Math.abs(piece.x - correctX);
        const dy = Math.abs(piece.y - correctY);

        if (dx < threshold && dy < threshold) {
            piece.x = correctX;
            piece.y = correctY;
            piece.setData('snapped', true);
            piece.disableInteractive();
            piece.setDepth(0);
            piece.setAlpha(1);
            return true;
        }
        return false;
    }
};
