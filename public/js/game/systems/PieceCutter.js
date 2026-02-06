/**
 * PieceCutter generates the edge map and draws jigsaw-shaped paths.
 *
 * Edge types: 0 = FLAT, 1 = TAB (protrudes out), -1 = BLANK (indents in)
 * Adjacent pieces get complementary edges: if piece (0,0) right edge = TAB,
 * then piece (1,0) left edge = BLANK.
 */
const PieceCutter = {

    /**
     * Generate edge map for a grid of cols x rows.
     * Returns { horizontal, vertical } arrays of edge types.
     *
     * horizontal[row][col] = edge between (row, col) and (row, col+1)
     *   - cols-1 entries per row
     * vertical[row][col] = edge between (row, col) and (row+1, col)
     *   - rows-1 entries
     */
    generateEdgeMap(cols, rows) {
        const horizontal = [];
        const vertical = [];

        for (let row = 0; row < rows; row++) {
            horizontal[row] = [];
            for (let col = 0; col < cols - 1; col++) {
                horizontal[row][col] = Math.random() < 0.5 ? 1 : -1;
            }
        }

        for (let row = 0; row < rows - 1; row++) {
            vertical[row] = [];
            for (let col = 0; col < cols; col++) {
                vertical[row][col] = Math.random() < 0.5 ? 1 : -1;
            }
        }

        return { horizontal, vertical };
    },

    /**
     * Get the four edges for piece at (col, row).
     * Returns { top, right, bottom, left } where each is 0, 1, or -1.
     */
    getEdges(edgeMap, col, row, cols, rows) {
        const top = row === 0 ? 0 : -edgeMap.vertical[row - 1][col];
        const bottom = row === rows - 1 ? 0 : edgeMap.vertical[row][col];
        const left = col === 0 ? 0 : -edgeMap.horizontal[row][col - 1];
        const right = col === cols - 1 ? 0 : edgeMap.horizontal[row][col];
        return { top, right, bottom, left };
    },

    /**
     * Draw a jigsaw piece path on a canvas 2D context.
     * The path is drawn within a canvas of size (canvasW, canvasH).
     * The piece cell occupies the center with tab overflow margins.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} cellW - piece cell width (without tabs)
     * @param {number} cellH - piece cell height (without tabs)
     * @param {object} edges - { top, right, bottom, left } edge types
     * @param {number} tabW - horizontal tab size in pixels
     * @param {number} tabH - vertical tab size in pixels
     */
    drawPiecePath(ctx, cellW, cellH, edges, tabW, tabH) {
        const ox = tabW;  // offset x - left margin for tab overflow
        const oy = tabH;  // offset y - top margin for tab overflow

        ctx.beginPath();
        ctx.moveTo(ox, oy);

        // Top edge (left to right)
        this._drawEdge(ctx, ox, oy, cellW, 0, edges.top, tabH, 'horizontal');

        // Right edge (top to bottom)
        this._drawEdge(ctx, ox + cellW, oy, cellH, 0, edges.right, tabW, 'vertical');

        // Bottom edge (right to left)
        this._drawEdge(ctx, ox + cellW, oy + cellH, cellW, 0, edges.bottom, tabH, 'horizontal-reverse');

        // Left edge (bottom to top)
        this._drawEdge(ctx, ox, oy + cellH, cellH, 0, edges.left, tabW, 'vertical-reverse');

        ctx.closePath();
    },

    /**
     * Draw one edge of the jigsaw piece using cubic Bezier curves.
     * The tab/blank is drawn at the center of the edge.
     */
    _drawEdge(ctx, startX, startY, length, offset, edgeType, tabSize, direction) {
        // edgeType: 0=flat, 1=tab (outward), -1=blank (inward)
        const sign = edgeType; // 1 or -1, 0 means flat

        if (edgeType === 0) {
            // Flat edge - straight line
            switch (direction) {
                case 'horizontal':
                    ctx.lineTo(startX + length, startY);
                    break;
                case 'vertical':
                    ctx.lineTo(startX, startY + length);
                    break;
                case 'horizontal-reverse':
                    ctx.lineTo(startX - length, startY);
                    break;
                case 'vertical-reverse':
                    ctx.lineTo(startX, startY - length);
                    break;
            }
            return;
        }

        // Draw tab/blank with bezier curves
        // Split the edge into: straight -> curve out -> tab bump -> curve back -> straight
        const third = length / 3;

        switch (direction) {
            case 'horizontal': {
                // First third - straight
                ctx.lineTo(startX + third, startY);
                // Curve into tab/blank
                ctx.bezierCurveTo(
                    startX + third + third * 0.1, startY,
                    startX + third + third * 0.05, startY - sign * tabSize * 0.8,
                    startX + third + third * 0.25, startY - sign * tabSize
                );
                // Tab top curve
                ctx.bezierCurveTo(
                    startX + third + third * 0.45, startY - sign * tabSize * 1.15,
                    startX + third + third * 0.55, startY - sign * tabSize * 1.15,
                    startX + third + third * 0.75, startY - sign * tabSize
                );
                // Curve back
                ctx.bezierCurveTo(
                    startX + third + third * 0.95, startY - sign * tabSize * 0.8,
                    startX + third + third * 0.9, startY,
                    startX + third * 2, startY
                );
                // Last third - straight
                ctx.lineTo(startX + length, startY);
                break;
            }
            case 'vertical': {
                ctx.lineTo(startX, startY + third);
                ctx.bezierCurveTo(
                    startX, startY + third + third * 0.1,
                    startX + sign * tabSize * 0.8, startY + third + third * 0.05,
                    startX + sign * tabSize, startY + third + third * 0.25
                );
                ctx.bezierCurveTo(
                    startX + sign * tabSize * 1.15, startY + third + third * 0.45,
                    startX + sign * tabSize * 1.15, startY + third + third * 0.55,
                    startX + sign * tabSize, startY + third + third * 0.75
                );
                ctx.bezierCurveTo(
                    startX + sign * tabSize * 0.8, startY + third + third * 0.95,
                    startX, startY + third + third * 0.9,
                    startX, startY + third * 2
                );
                ctx.lineTo(startX, startY + length);
                break;
            }
            case 'horizontal-reverse': {
                ctx.lineTo(startX - third, startY);
                ctx.bezierCurveTo(
                    startX - third - third * 0.1, startY,
                    startX - third - third * 0.05, startY + sign * tabSize * 0.8,
                    startX - third - third * 0.25, startY + sign * tabSize
                );
                ctx.bezierCurveTo(
                    startX - third - third * 0.45, startY + sign * tabSize * 1.15,
                    startX - third - third * 0.55, startY + sign * tabSize * 1.15,
                    startX - third - third * 0.75, startY + sign * tabSize
                );
                ctx.bezierCurveTo(
                    startX - third - third * 0.95, startY + sign * tabSize * 0.8,
                    startX - third - third * 0.9, startY,
                    startX - third * 2, startY
                );
                ctx.lineTo(startX - length, startY);
                break;
            }
            case 'vertical-reverse': {
                ctx.lineTo(startX, startY - third);
                ctx.bezierCurveTo(
                    startX, startY - third - third * 0.1,
                    startX - sign * tabSize * 0.8, startY - third - third * 0.05,
                    startX - sign * tabSize, startY - third - third * 0.25
                );
                ctx.bezierCurveTo(
                    startX - sign * tabSize * 1.15, startY - third - third * 0.45,
                    startX - sign * tabSize * 1.15, startY - third - third * 0.55,
                    startX - sign * tabSize, startY - third - third * 0.75
                );
                ctx.bezierCurveTo(
                    startX - sign * tabSize * 0.8, startY - third - third * 0.95,
                    startX, startY - third - third * 0.9,
                    startX, startY - third * 2
                );
                ctx.lineTo(startX, startY - length);
                break;
            }
        }
    }
};
