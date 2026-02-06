/**
 * PieceFactory creates Phaser game objects for each jigsaw piece
 * by clipping the source image using offscreen canvases.
 */
const PieceFactory = {

    /**
     * Create all puzzle pieces as Phaser sprites.
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

    _createPiece(scene, sourceImage, col, row, cols, rows, cellW, cellH, tabW, tabH, edges) {
        // Canvas size includes tab overflow on all sides
        const canvasW = Math.ceil(cellW + tabW * 2);
        const canvasH = Math.ceil(cellH + tabH * 2);

        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');

        // Draw the jigsaw piece clip path
        PieceCutter.drawPiecePath(ctx, cellW, cellH, edges, tabW, tabH);
        ctx.clip();

        // Source region from the full image (with tab overflow)
        const sx = col * cellW - tabW;
        const sy = row * cellH - tabH;

        ctx.drawImage(sourceImage, sx, sy, canvasW, canvasH, 0, 0, canvasW, canvasH);

        // Draw subtle border along the piece edge
        PieceCutter.drawPiecePath(ctx, cellW, cellH, edges, tabW, tabH);
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
