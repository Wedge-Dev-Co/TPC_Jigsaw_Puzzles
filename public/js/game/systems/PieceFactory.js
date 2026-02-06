/**
 * PieceFactory creates Phaser game objects for each jigsaw piece
 * by clipping the source image using offscreen canvases.
 */
const PieceFactory = {

    /**
     * Create all puzzle pieces synchronously (for small puzzles).
     *
     * @param {Phaser.Scene} scene
     * @param {object} edgeMap - from PieceCutter.generateEdgeMap
     * @param {number} cols
     * @param {number} rows
     * @returns {Phaser.GameObjects.Sprite[]}
     */
    createPieces(scene, edgeMap, cols, rows) {
        const imgTexture = scene.textures.get(GAME_DATA.imageKey);
        const sourceImage = imgTexture.getSourceImage();

        const cellW = sourceImage.width / cols;
        const cellH = sourceImage.height / rows;
        const tabW = Math.round(cellW * CONSTANTS.TAB_SIZE);
        const tabH = Math.round(cellH * CONSTANTS.TAB_SIZE);

        const pieces = [];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const edges = PieceCutter.getEdges(edgeMap, col, row, cols, rows);
                const piece = this._createPiece(
                    scene, sourceImage, col, row, cols, rows,
                    cellW, cellH, tabW, tabH, edges
                );
                pieces.push(piece);
            }
        }

        return pieces;
    },

    /**
     * Create pieces asynchronously in batches (for large puzzles).
     * Yields between batches via requestAnimationFrame to keep UI responsive.
     *
     * @param {Phaser.Scene} scene
     * @param {object} edgeMap
     * @param {number} cols
     * @param {number} rows
     * @param {function} onProgress - called with fraction (0-1) after each batch
     * @returns {Promise<Phaser.GameObjects.Sprite[]>}
     */
    createPiecesAsync(scene, edgeMap, cols, rows, onProgress) {
        const imgTexture = scene.textures.get(GAME_DATA.imageKey);
        const sourceImage = imgTexture.getSourceImage();

        const cellW = sourceImage.width / cols;
        const cellH = sourceImage.height / rows;
        const tabW = Math.round(cellW * CONSTANTS.TAB_SIZE);
        const tabH = Math.round(cellH * CONSTANTS.TAB_SIZE);

        const totalPieces = cols * rows;
        const pieces = [];
        const batchSize = 50;
        let index = 0;

        return new Promise((resolve) => {
            const processBatch = () => {
                const end = Math.min(index + batchSize, totalPieces);
                for (; index < end; index++) {
                    const col = index % cols;
                    const row = Math.floor(index / cols);
                    const edges = PieceCutter.getEdges(edgeMap, col, row, cols, rows);
                    const piece = this._createPiece(
                        scene, sourceImage, col, row, cols, rows,
                        cellW, cellH, tabW, tabH, edges
                    );
                    pieces.push(piece);
                }

                if (onProgress) {
                    onProgress(index / totalPieces);
                }

                if (index < totalPieces) {
                    requestAnimationFrame(processBatch);
                } else {
                    resolve(pieces);
                }
            };

            requestAnimationFrame(processBatch);
        });
    },

    _createPiece(scene, sourceImage, col, row, cols, rows, cellW, cellH, tabW, tabH, edges) {
        // Canvas margin is larger than tabSize to accommodate Bezier overshoot
        const marginW = Math.ceil(tabW * 1.25);
        const marginH = Math.ceil(tabH * 1.25);
        const canvasW = Math.ceil(cellW + marginW * 2);
        const canvasH = Math.ceil(cellH + marginH * 2);

        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');

        // Draw the jigsaw piece clip path (margin > tabSize for overshoot room)
        PieceCutter.drawPiecePath(ctx, cellW, cellH, edges, tabW, tabH, marginW, marginH);
        ctx.clip();

        // Source region from the full image (with overflow margin)
        const sx = col * cellW - marginW;
        const sy = row * cellH - marginH;

        ctx.drawImage(sourceImage, sx, sy, canvasW, canvasH, 0, 0, canvasW, canvasH);

        // Draw subtle border along the piece edge
        PieceCutter.drawPiecePath(ctx, cellW, cellH, edges, tabW, tabH, marginW, marginH);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Register as Phaser texture
        const textureKey = `piece-${col}-${row}`;
        if (scene.textures.exists(textureKey)) {
            scene.textures.remove(textureKey);
        }
        scene.textures.addCanvas(textureKey, canvas);

        // Create sprite
        const sprite = scene.add.sprite(0, 0, textureKey);
        sprite.setOrigin(0.5, 0.5);
        sprite.setScale(GAME_DATA.puzzleScale);

        // Store piece data
        sprite.setData('col', col);
        sprite.setData('row', row);
        sprite.setData('snapped', false);
        sprite.setData('defaultDepth', 1);

        // The correct position when snapped (center of piece cell in screen coords)
        const correctX = GAME_DATA.boardOriginX + (col * cellW + cellW / 2) * GAME_DATA.puzzleScale;
        const correctY = GAME_DATA.boardOriginY + (row * cellH + cellH / 2) * GAME_DATA.puzzleScale;
        sprite.setData('correctX', correctX);
        sprite.setData('correctY', correctY);

        // Make interactive + draggable
        sprite.setInteractive({ draggable: true, pixelPerfect: false, useHandCursor: true });
        scene.input.setDraggable(sprite);

        return sprite;
    }
};
