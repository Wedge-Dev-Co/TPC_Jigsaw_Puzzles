class PuzzleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PuzzleScene' });
    }

    create() {
        const { width, height } = this.scale;
        this.snappedCount = 0;
        this.totalPieces = GAME_DATA.gridCols * GAME_DATA.gridRows;

        // Draw board and tray backgrounds
        this.boardWidth = Math.floor(width * CONSTANTS.BOARD_RATIO);
        this.trayWidth = width - this.boardWidth;

        this.boardBg = this.add.rectangle(
            this.boardWidth / 2, height / 2,
            this.boardWidth, height,
            CONSTANTS.BOARD_COLOR
        ).setDepth(-2);

        this.trayBg = this.add.rectangle(
            this.boardWidth + this.trayWidth / 2, height / 2,
            this.trayWidth, height,
            CONSTANTS.TRAY_COLOR
        ).setDepth(-2);

        // Divider line between board and tray
        this.divider = this.add.rectangle(
            this.boardWidth, height / 2, 2, height, 0x333355
        ).setDepth(-1);

        // Get source image dimensions
        const imgTexture = this.textures.get(GAME_DATA.imageKey);
        const imgFrame = imgTexture.getSourceImage();
        GAME_DATA.imageWidth = imgFrame.width;
        GAME_DATA.imageHeight = imgFrame.height;

        // Calculate piece dimensions
        const cols = GAME_DATA.gridCols;
        const rows = GAME_DATA.gridRows;
        const cellW = imgFrame.width / cols;
        const cellH = imgFrame.height / rows;
        GAME_DATA.cellWidth = cellW;
        GAME_DATA.cellHeight = cellH;

        // Calculate scale so assembled puzzle fits in board area with padding
        const padding = 50;
        const maxW = this.boardWidth - padding * 2;
        const maxH = height - padding * 2;
        const scaleToFit = Math.min(maxW / imgFrame.width, maxH / imgFrame.height);
        GAME_DATA.puzzleScale = scaleToFit;

        // Dynamic snap threshold based on piece screen size
        const pieceScrW = cellW * scaleToFit;
        const pieceScrH = cellH * scaleToFit;
        const smallerDim = Math.min(pieceScrW, pieceScrH);
        this.snapThreshold = Math.max(8, Math.min(smallerDim * 0.6, 30));

        // Board origin (top-left of where the assembled puzzle sits)
        GAME_DATA.boardOriginX = padding + (maxW - imgFrame.width * scaleToFit) / 2;
        GAME_DATA.boardOriginY = padding + (maxH - imgFrame.height * scaleToFit) / 2;

        // Draw a subtle ghost outline showing where the puzzle goes
        this.ghostOutline = this.add.rectangle(
            GAME_DATA.boardOriginX + (imgFrame.width * scaleToFit) / 2,
            GAME_DATA.boardOriginY + (imgFrame.height * scaleToFit) / 2,
            imgFrame.width * scaleToFit,
            imgFrame.height * scaleToFit
        ).setStrokeStyle(1, 0x444466).setFillStyle().setDepth(-1);

        // Generate edge map
        const edgeMap = PieceCutter.generateEdgeMap(cols, rows);

        if (this.totalPieces > 100) {
            // Async piece creation for large puzzles
            this._showProgress();
            PieceFactory.createPiecesAsync(this, edgeMap, cols, rows, (fraction) => {
                this._updateProgress(fraction);
            }).then((pieces) => {
                this.pieces = pieces;
                this._hideProgress();
                this.finishSetup();
            });
        } else {
            // Synchronous for small puzzles
            this.pieces = PieceFactory.createPieces(this, edgeMap, cols, rows);
            this.finishSetup();
        }

        // Handle resize
        this.scale.on('resize', (gameSize) => {
            this.handleResize(gameSize);
        });
    }

    _showProgress() {
        const { width, height } = this.scale;
        this.progressText = this.add.text(width / 2, height / 2, 'Cutting pieces... 0%', {
            fontSize: '20px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#e0c097'
        }).setOrigin(0.5).setDepth(5000);
    }

    _updateProgress(fraction) {
        if (this.progressText) {
            this.progressText.setText(`Cutting pieces... ${Math.round(fraction * 100)}%`);
        }
    }

    _hideProgress() {
        if (this.progressText) {
            this.progressText.destroy();
            this.progressText = null;
        }
    }

    finishSetup() {
        const { height } = this.scale;
        const scaleToFit = GAME_DATA.puzzleScale;

        // Build piece lookup and initialize groups
        this.pieceMap = SnapSystem.buildPieceMap(
            this.pieces, GAME_DATA.gridCols, GAME_DATA.gridRows
        );
        SnapSystem.initGroups(this.pieces);

        // Scramble pieces into the tray
        ScrambleSystem.scatter(this.pieces, this.boardWidth, 0, this.trayWidth, height, scaleToFit);

        // Set up drag & drop (group-aware)
        this.input.on('dragstart', (pointer, gameObject) => {
            const group = gameObject.getData('group');
            group.forEach(p => {
                p.setDepth(1000);
                p.setScale(GAME_DATA.puzzleScale * 1.05);
                p.setAlpha(0.9);
            });
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            // Compute delta from where Phaser wants to place the piece
            const dx = dragX - gameObject.x;
            const dy = dragY - gameObject.y;
            const group = gameObject.getData('group');
            group.forEach(p => {
                p.x += dx;
                p.y += dy;
            });
        });

        this.input.on('dragend', (pointer, gameObject) => {
            const group = gameObject.getData('group');
            group.forEach(p => {
                p.setScale(GAME_DATA.puzzleScale);
                p.setAlpha(1);
                p.setDepth(p.getData('defaultDepth') || 1);
            });

            // 1) Try snapping to adjacent groups anywhere on screen
            const neighborSnapped = SnapSystem.trySnapToNeighbors(
                gameObject, this.pieceMap, GAME_DATA, this.snapThreshold
            );

            // 2) Try snapping the (possibly larger) group to the board
            const boardSnappedCount = SnapSystem.trySnapToBoard(
                gameObject, GAME_DATA, this.snapThreshold
            );

            if (neighborSnapped || boardSnappedCount > 0) {
                this.tweens.add({
                    targets: gameObject.getData('group'),
                    alpha: { from: 0.5, to: 1 },
                    duration: 150,
                    ease: 'Power2'
                });
            }

            if (boardSnappedCount > 0) {
                this.snappedCount += boardSnappedCount;
                this.updateCounter();
                this.checkWin();
            }
        });

        // UI elements (on top)
        this.createUI();
    }

    createUI() {
        const { width, height } = this.scale;

        // Piece counter
        this.counterText = this.add.text(this.boardWidth + 15, 15,
            `0 / ${this.totalPieces}`, {
            fontSize: '16px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#e0c097'
        }).setDepth(2000);

        // "Show Image" button (replaces always-visible thumbnail)
        this.refOverlayVisible = false;
        this.refBtn = this.add.text(this.boardWidth + this.trayWidth / 2, height - 40,
            'Show Image', {
            fontSize: '14px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#e0c097',
            backgroundColor: '#16213e',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2000);

        this.refBtn.on('pointerdown', () => this.toggleReferenceImage());
        this.refBtn.on('pointerover', () => this.refBtn.setColor('#fff'));
        this.refBtn.on('pointerout', () => this.refBtn.setColor('#e0c097'));

        // R key shortcut for reference image toggle
        this.input.keyboard.on('keydown-R', () => this.toggleReferenceImage());

        // Fullscreen button
        const fsBtn = this.add.text(width - 15, 15, '[ ]', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#888',
            backgroundColor: '#16213e',
            padding: { x: 6, y: 4 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(2000);

        fsBtn.on('pointerdown', () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            } else {
                this.scale.startFullscreen();
            }
        });
        fsBtn.on('pointerover', () => fsBtn.setColor('#e0c097'));
        fsBtn.on('pointerout', () => fsBtn.setColor('#888'));

        // Back to menu button
        const backBtn = this.add.text(15, 15, 'Menu', {
            fontSize: '16px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#888',
            backgroundColor: '#16213e',
            padding: { x: 8, y: 4 }
        }).setInteractive({ useHandCursor: true }).setDepth(2000);

        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
        backBtn.on('pointerover', () => backBtn.setColor('#e0c097'));
        backBtn.on('pointerout', () => backBtn.setColor('#888'));
    }

    toggleReferenceImage() {
        if (this.refOverlayVisible) {
            // Hide overlay
            if (this.refOverlayGroup) {
                this.refOverlayGroup.forEach(obj => obj.destroy());
                this.refOverlayGroup = null;
            }
            this.refOverlayVisible = false;
            this.refBtn.setText('Show Image');
        } else {
            // Show overlay
            const { width, height } = this.scale;
            this.refOverlayGroup = [];

            const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
                .setDepth(3000).setInteractive({ useHandCursor: true });
            backdrop.on('pointerdown', () => this.toggleReferenceImage());
            this.refOverlayGroup.push(backdrop);

            const imgTexture = this.textures.get(GAME_DATA.imageKey);
            const imgFrame = imgTexture.getSourceImage();
            const pad = 60;
            const overlayScale = Math.min((width - pad * 2) / imgFrame.width, (height - pad * 2) / imgFrame.height);
            const refImg = this.add.image(width / 2, height / 2, GAME_DATA.imageKey)
                .setScale(overlayScale).setDepth(3001);
            this.refOverlayGroup.push(refImg);

            const hint = this.add.text(width / 2, height - 30, 'Click anywhere to dismiss (R)', {
                fontSize: '14px',
                fontFamily: 'Segoe UI, sans-serif',
                color: '#aaa'
            }).setOrigin(0.5).setDepth(3002);
            this.refOverlayGroup.push(hint);

            this.refOverlayVisible = true;
            this.refBtn.setText('Hide Image');
        }
    }

    updateCounter() {
        this.counterText.setText(`${this.snappedCount} / ${this.totalPieces}`);
    }

    checkWin() {
        if (this.snappedCount >= this.totalPieces) {
            // Brief delay before victory screen
            this.time.delayedCall(500, () => {
                this.scene.start('WinScene');
            });
        }
    }

    handleResize(gameSize) {
        const { width, height } = gameSize;
        this.boardWidth = Math.floor(width * CONSTANTS.BOARD_RATIO);
        this.trayWidth = width - this.boardWidth;

        this.boardBg.setPosition(this.boardWidth / 2, height / 2);
        this.boardBg.setSize(this.boardWidth, height);

        this.trayBg.setPosition(this.boardWidth + this.trayWidth / 2, height / 2);
        this.trayBg.setSize(this.trayWidth, height);

        this.divider.setPosition(this.boardWidth, height / 2);
        this.divider.setSize(2, height);
    }
}
