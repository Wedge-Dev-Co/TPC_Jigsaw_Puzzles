/**
 * PieceCutter generates the edge map and draws jigsaw-shaped paths.
 *
 * Edge types: 0 = FLAT, 1 = TAB (protrudes out), -1 = BLANK (indents in)
 * Adjacent pieces get complementary edges: if piece (0,0) right edge = TAB,
 * then piece (1,0) left edge = BLANK.
 *
 * Each non-flat edge also carries a shape variant index (0-5) so adjacent
 * pieces share the same Bezier profile, ensuring complementary fit.
 */

/**
 * 6 distinct Bezier tab profiles. Each profile has 9 control points defined
 * as { along, perp } pairs:
 *   along = fraction of the middle third (0-1), horizontal position
 *   perp  = multiplier of tabSize, depth/height
 *
 * Points map to 3 bezierCurveTo calls (9 points total):
 *   Curve 1 (entry): cp1, cp2, end  -> transition from edge into tab
 *   Curve 2 (cap):   cp1, cp2, end  -> tab top/bump
 *   Curve 3 (exit):  cp1, cp2, end  -> transition from tab back to edge
 *
 * IMPORTANT: Reverse-direction edges (horizontal-reverse, vertical-reverse)
 * must use the profile in reversed order with mirrored along values so that
 * both sides of a shared edge trace the exact same Bezier curve.
 */
const SHAPE_VARIANTS = [
    { // 0: standard - symmetric rounded tab (preserves original look)
        name: 'standard',
        points: [
            { along: 0.10, perp: 0.00 }, { along: 0.05, perp: 0.80 }, { along: 0.25, perp: 1.00 },
            { along: 0.45, perp: 1.15 }, { along: 0.55, perp: 1.15 }, { along: 0.75, perp: 1.00 },
            { along: 0.95, perp: 0.80 }, { along: 0.90, perp: 0.00 }, { along: 1.00, perp: 0.00 }
        ]
    },
    { // 1: wide - broader tab, entry/exit spread further apart
        name: 'wide',
        points: [
            { along: 0.00, perp: 0.00 }, { along: -0.05, perp: 0.65 }, { along: 0.10, perp: 0.85 },
            { along: 0.30, perp: 1.05 }, { along: 0.70, perp: 1.05 }, { along: 0.90, perp: 0.85 },
            { along: 1.05, perp: 0.65 }, { along: 1.00, perp: 0.00 }, { along: 1.00, perp: 0.00 }
        ]
    },
    { // 2: narrow-tall - narrow but taller, more pronounced
        name: 'narrow-tall',
        points: [
            { along: 0.15, perp: 0.00 }, { along: 0.15, perp: 0.85 }, { along: 0.28, perp: 1.10 },
            { along: 0.38, perp: 1.15 }, { along: 0.62, perp: 1.15 }, { along: 0.72, perp: 1.10 },
            { along: 0.85, perp: 0.85 }, { along: 0.85, perp: 0.00 }, { along: 1.00, perp: 0.00 }
        ]
    },
    { // 3: lean-left - asymmetric, tab shifts toward start of edge
        name: 'lean-left',
        points: [
            { along: 0.05, perp: 0.00 }, { along: 0.00, perp: 0.80 }, { along: 0.15, perp: 1.00 },
            { along: 0.25, perp: 1.15 }, { along: 0.45, perp: 1.10 }, { along: 0.60, perp: 0.90 },
            { along: 0.80, perp: 0.65 }, { along: 0.90, perp: 0.00 }, { along: 1.00, perp: 0.00 }
        ]
    },
    { // 4: lean-right - asymmetric, tab shifts toward end of edge
        name: 'lean-right',
        points: [
            { along: 0.10, perp: 0.00 }, { along: 0.20, perp: 0.65 }, { along: 0.40, perp: 0.90 },
            { along: 0.55, perp: 1.10 }, { along: 0.75, perp: 1.15 }, { along: 0.85, perp: 1.00 },
            { along: 1.00, perp: 0.80 }, { along: 0.95, perp: 0.00 }, { along: 1.00, perp: 0.00 }
        ]
    },
    { // 5: squat - short and wide, more squared-off profile
        name: 'squat',
        points: [
            { along: 0.05, perp: 0.00 }, { along: 0.00, perp: 0.45 }, { along: 0.10, perp: 0.65 },
            { along: 0.30, perp: 0.75 }, { along: 0.70, perp: 0.75 }, { along: 0.90, perp: 0.65 },
            { along: 1.00, perp: 0.45 }, { along: 0.95, perp: 0.00 }, { along: 1.00, perp: 0.00 }
        ]
    }
];

const PieceCutter = {

    /**
     * Generate edge map for a grid of cols x rows.
     * Returns { horizontal, vertical } arrays of edge objects.
     *
     * Each entry is { type: 1|-1, variant: 0..5 }
     * horizontal[row][col] = edge between (row, col) and (row, col+1)
     * vertical[row][col] = edge between (row, col) and (row+1, col)
     */
    generateEdgeMap(cols, rows) {
        const horizontal = [];
        const vertical = [];
        const numVariants = SHAPE_VARIANTS.length;

        for (let row = 0; row < rows; row++) {
            horizontal[row] = [];
            for (let col = 0; col < cols - 1; col++) {
                horizontal[row][col] = {
                    type: Math.random() < 0.5 ? 1 : -1,
                    variant: Math.floor(Math.random() * numVariants)
                };
            }
        }

        for (let row = 0; row < rows - 1; row++) {
            vertical[row] = [];
            for (let col = 0; col < cols; col++) {
                vertical[row][col] = {
                    type: Math.random() < 0.5 ? 1 : -1,
                    variant: Math.floor(Math.random() * numVariants)
                };
            }
        }

        return { horizontal, vertical };
    },

    /**
     * Get the four edges for piece at (col, row).
     * Returns { top, right, bottom, left } where each is 0 (flat) or
     * { type: 1|-1, variant: 0..5 }.
     */
    getEdges(edgeMap, col, row, cols, rows) {
        const top = row === 0 ? 0
            : { type: -edgeMap.vertical[row - 1][col].type, variant: edgeMap.vertical[row - 1][col].variant };
        const bottom = row === rows - 1 ? 0 : edgeMap.vertical[row][col];
        const left = col === 0 ? 0
            : { type: -edgeMap.horizontal[row][col - 1].type, variant: edgeMap.horizontal[row][col - 1].variant };
        const right = col === cols - 1 ? 0 : edgeMap.horizontal[row][col];
        return { top, right, bottom, left };
    },

    /**
     * Draw a jigsaw piece path on a canvas 2D context.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} cellW - piece cell width (without tabs)
     * @param {number} cellH - piece cell height (without tabs)
     * @param {object} edges - { top, right, bottom, left } edge descriptors
     * @param {number} tabW - horizontal tab amplitude in pixels
     * @param {number} tabH - vertical tab amplitude in pixels
     * @param {number} [marginW] - canvas left/right margin (defaults to tabW)
     * @param {number} [marginH] - canvas top/bottom margin (defaults to tabH)
     */
    drawPiecePath(ctx, cellW, cellH, edges, tabW, tabH, marginW, marginH) {
        const ox = marginW !== undefined ? marginW : tabW;
        const oy = marginH !== undefined ? marginH : tabH;

        ctx.beginPath();
        ctx.moveTo(ox, oy);

        // Top edge (left to right)
        this._drawEdge(ctx, ox, oy, cellW, edges.top, tabH, 'horizontal');
        // Right edge (top to bottom)
        this._drawEdge(ctx, ox + cellW, oy, cellH, edges.right, tabW, 'vertical');
        // Bottom edge (right to left)
        this._drawEdge(ctx, ox + cellW, oy + cellH, cellW, edges.bottom, tabH, 'horizontal-reverse');
        // Left edge (bottom to top)
        this._drawEdge(ctx, ox, oy + cellH, cellH, edges.left, tabW, 'vertical-reverse');

        ctx.closePath();
    },

    /**
     * Reverse a profile for use in reverse-direction edge drawing.
     * Reverses the Bezier control point order and mirrors along values
     * so that the resulting curve is geometrically identical to the
     * forward-direction curve (traced in the opposite direction).
     *
     * Forward:  Bez(p0,p1,p2) → Bez(p3,p4,p5) → Bez(p6,p7,p8)
     * Reversed: Bez(p7,p6,p5) → Bez(p4,p3,p2) → Bez(p1,p0,end)
     * with each along value mirrored to (1 - along).
     */
    _reverseProfile(profile) {
        return [
            { along: 1 - profile[7].along, perp: profile[7].perp },
            { along: 1 - profile[6].along, perp: profile[6].perp },
            { along: 1 - profile[5].along, perp: profile[5].perp },
            { along: 1 - profile[4].along, perp: profile[4].perp },
            { along: 1 - profile[3].along, perp: profile[3].perp },
            { along: 1 - profile[2].along, perp: profile[2].perp },
            { along: 1 - profile[1].along, perp: profile[1].perp },
            { along: 1 - profile[0].along, perp: profile[0].perp },
            { along: 1.0, perp: 0.0 }
        ];
    },

    /**
     * Draw one edge of the jigsaw piece using cubic Bezier curves.
     * Reads profile from SHAPE_VARIANTS[variant].
     * Reverse directions use a reversed profile so adjacent pieces match.
     */
    _drawEdge(ctx, startX, startY, length, edge, tabSize, direction) {
        // edge is 0 (flat) or { type: 1|-1, variant: 0..5 }
        if (edge === 0) {
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

        const sign = edge.type;
        const fwdProfile = SHAPE_VARIANTS[edge.variant].points;
        const isReverse = direction === 'horizontal-reverse' || direction === 'vertical-reverse';
        const p = isReverse ? this._reverseProfile(fwdProfile) : fwdProfile;
        const third = length / 3;

        switch (direction) {
            case 'horizontal': {
                ctx.lineTo(startX + third, startY);
                ctx.bezierCurveTo(
                    startX + third + third * p[0].along, startY - sign * tabSize * p[0].perp,
                    startX + third + third * p[1].along, startY - sign * tabSize * p[1].perp,
                    startX + third + third * p[2].along, startY - sign * tabSize * p[2].perp
                );
                ctx.bezierCurveTo(
                    startX + third + third * p[3].along, startY - sign * tabSize * p[3].perp,
                    startX + third + third * p[4].along, startY - sign * tabSize * p[4].perp,
                    startX + third + third * p[5].along, startY - sign * tabSize * p[5].perp
                );
                ctx.bezierCurveTo(
                    startX + third + third * p[6].along, startY - sign * tabSize * p[6].perp,
                    startX + third + third * p[7].along, startY - sign * tabSize * p[7].perp,
                    startX + third + third * p[8].along, startY - sign * tabSize * p[8].perp
                );
                ctx.lineTo(startX + length, startY);
                break;
            }
            case 'vertical': {
                ctx.lineTo(startX, startY + third);
                ctx.bezierCurveTo(
                    startX + sign * tabSize * p[0].perp, startY + third + third * p[0].along,
                    startX + sign * tabSize * p[1].perp, startY + third + third * p[1].along,
                    startX + sign * tabSize * p[2].perp, startY + third + third * p[2].along
                );
                ctx.bezierCurveTo(
                    startX + sign * tabSize * p[3].perp, startY + third + third * p[3].along,
                    startX + sign * tabSize * p[4].perp, startY + third + third * p[4].along,
                    startX + sign * tabSize * p[5].perp, startY + third + third * p[5].along
                );
                ctx.bezierCurveTo(
                    startX + sign * tabSize * p[6].perp, startY + third + third * p[6].along,
                    startX + sign * tabSize * p[7].perp, startY + third + third * p[7].along,
                    startX + sign * tabSize * p[8].perp, startY + third + third * p[8].along
                );
                ctx.lineTo(startX, startY + length);
                break;
            }
            case 'horizontal-reverse': {
                ctx.lineTo(startX - third, startY);
                ctx.bezierCurveTo(
                    startX - third - third * p[0].along, startY + sign * tabSize * p[0].perp,
                    startX - third - third * p[1].along, startY + sign * tabSize * p[1].perp,
                    startX - third - third * p[2].along, startY + sign * tabSize * p[2].perp
                );
                ctx.bezierCurveTo(
                    startX - third - third * p[3].along, startY + sign * tabSize * p[3].perp,
                    startX - third - third * p[4].along, startY + sign * tabSize * p[4].perp,
                    startX - third - third * p[5].along, startY + sign * tabSize * p[5].perp
                );
                ctx.bezierCurveTo(
                    startX - third - third * p[6].along, startY + sign * tabSize * p[6].perp,
                    startX - third - third * p[7].along, startY + sign * tabSize * p[7].perp,
                    startX - third - third * p[8].along, startY + sign * tabSize * p[8].perp
                );
                ctx.lineTo(startX - length, startY);
                break;
            }
            case 'vertical-reverse': {
                ctx.lineTo(startX, startY - third);
                ctx.bezierCurveTo(
                    startX - sign * tabSize * p[0].perp, startY - third - third * p[0].along,
                    startX - sign * tabSize * p[1].perp, startY - third - third * p[1].along,
                    startX - sign * tabSize * p[2].perp, startY - third - third * p[2].along
                );
                ctx.bezierCurveTo(
                    startX - sign * tabSize * p[3].perp, startY - third - third * p[3].along,
                    startX - sign * tabSize * p[4].perp, startY - third - third * p[4].along,
                    startX - sign * tabSize * p[5].perp, startY - third - third * p[5].along
                );
                ctx.bezierCurveTo(
                    startX - sign * tabSize * p[6].perp, startY - third - third * p[6].along,
                    startX - sign * tabSize * p[7].perp, startY - third - third * p[7].along,
                    startX - sign * tabSize * p[8].perp, startY - third - third * p[8].along
                );
                ctx.lineTo(startX, startY - length);
                break;
            }
        }
    }
};
