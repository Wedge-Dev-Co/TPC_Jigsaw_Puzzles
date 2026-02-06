/**
 * SnapSystem handles snapping pieces to neighbors (anywhere) and to the board.
 *
 * Each piece belongs to a "group" (an array of sprites, shared by reference).
 * When two adjacent pieces from different groups are dropped close together,
 * their groups merge and move as a unit. Board-snap locks the entire group.
 */
const SnapSystem = {

    /**
     * Give every piece its own single-element group.
     */
    initGroups(pieces) {
        pieces.forEach(p => {
            p.setData('group', [p]);
        });
    },

    /**
     * Build a lookup map: pieceMap[row][col] = sprite.
     */
    buildPieceMap(pieces, cols, rows) {
        const map = [];
        for (let r = 0; r < rows; r++) map[r] = new Array(cols);
        pieces.forEach(p => {
            map[p.getData('row')][p.getData('col')] = p;
        });
        return map;
    },

    /**
     * After a drop, check whether the dragged piece's group is adjacent
     * to any other group within threshold. If so, align and merge.
     * Recurses to pick up chain-reactions (A snaps to B which is near C).
     *
     * @returns {boolean} true if at least one merge happened
     */
    trySnapToNeighbors(piece, pieceMap, gameData, threshold) {
        const group = piece.getData('group');
        const cols = gameData.gridCols;
        const rows = gameData.gridRows;
        const stepX = gameData.cellWidth * gameData.puzzleScale;
        const stepY = gameData.cellHeight * gameData.puzzleScale;

        for (const member of group) {
            const col = member.getData('col');
            const row = member.getData('row');

            const neighbors = [
                { dc: 1, dr: 0 },
                { dc: -1, dr: 0 },
                { dc: 0, dr: 1 },
                { dc: 0, dr: -1 }
            ];

            for (const { dc, dr } of neighbors) {
                const nc = col + dc;
                const nr = row + dr;
                if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;

                const neighbor = pieceMap[nr][nc];
                const neighborGroup = neighbor.getData('group');
                if (neighborGroup === group) continue; // already same group

                // Expected screen-space offset between these two cells
                const expectedDx = dc * stepX;
                const expectedDy = dr * stepY;

                // Actual offset
                const actualDx = neighbor.x - member.x;
                const actualDy = neighbor.y - member.y;

                if (Math.abs(actualDx - expectedDx) < threshold &&
                    Math.abs(actualDy - expectedDy) < threshold) {
                    // Align the dragged group so it matches the neighbor exactly
                    const offsetX = (neighbor.x - expectedDx) - member.x;
                    const offsetY = (neighbor.y - expectedDy) - member.y;
                    for (const p of group) {
                        p.x += offsetX;
                        p.y += offsetY;
                    }

                    this._mergeGroups(group, neighborGroup);

                    // Recurse — the larger group may now be adjacent to yet another
                    this.trySnapToNeighbors(piece, pieceMap, gameData, threshold);
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * Try to snap the piece's group to the board (final correct position).
     * If any non-snapped member is within threshold of its correct spot,
     * the whole group locks in place.
     *
     * @returns {number} count of pieces newly board-snapped (0 = no snap)
     */
    trySnapToBoard(piece, gameData, threshold) {
        const group = piece.getData('group');

        for (const member of group) {
            if (member.getData('snapped')) continue;

            const correctX = member.getData('correctX');
            const correctY = member.getData('correctY');
            const dx = Math.abs(member.x - correctX);
            const dy = Math.abs(member.y - correctY);

            if (dx < threshold && dy < threshold) {
                // Compute offset from this one piece, apply to all non-snapped
                const offsetX = correctX - member.x;
                const offsetY = correctY - member.y;

                let newSnaps = 0;
                for (const p of group) {
                    if (!p.getData('snapped')) {
                        p.x += offsetX;
                        p.y += offsetY;
                        p.setData('snapped', true);
                        p.disableInteractive();
                        p.setDepth(0);
                        p.setAlpha(1);
                        newSnaps++;
                    }
                }
                return newSnaps;
            }
        }

        return 0;
    },

    /**
     * Merge two groups into one. All pieces in both groups end up
     * referencing the same combined array.
     */
    _mergeGroups(groupA, groupB) {
        const merged = groupA.concat(groupB);
        for (const p of merged) {
            p.setData('group', merged);
        }
    }
};
