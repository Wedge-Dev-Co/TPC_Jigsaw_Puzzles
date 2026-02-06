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

        // Create pieces
        this.pieces = PieceFactory.createPieces(this, edgeMap, cols, rows);

        // Scramble pieces into the tray
        ScrambleSystem.scatter(this.pieces, this.boardWidth, 0, this.trayWidth, height, scaleToFit);

        // Set up drag & drop
        this.input.on('dragstart', (pointer, gameObject) => {
            gameObject.setDepth(1000);
            gameObject.setScale(GAME_DATA.puzzleScale * 1.05); // Slight grow on pick up
            gameObject.setAlpha(0.9);
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragend', (pointer, gameObject) => {
            gameObject.setScale(GAME_DATA.puzzleScale);
            gameObject.setAlpha(1);
            gameObject.setDepth(gameObject.getData('defaultDepth') || 1);

            const wasSnapped = SnapSystem.trySnap(gameObject, GAME_DATA, CONSTANTS.SNAP_THRESHOLD);
            if (wasSnapped) {
                this.snappedCount++;
                this.updateCounter();

                // Snap feedback: brief flash
                this.tweens.add({
                    targets: gameObject,
                    alpha: { from: 0.5, to: 1 },
                    duration: 150,
                    ease: 'Power2'
                });

                this.checkWin();
            }
        });

        // UI elements (on top)
        this.createUI();

        // Handle resize
        this.scale.on('resize', (gameSize) => {
            this.handleResize(gameSize);
        });
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

        // Reference image thumbnail (top-right of tray)
        const thumbMaxW = this.trayWidth * 0.7;
        const thumbMaxH = height * 0.2;
        const imgTexture = this.textures.get(GAME_DATA.imageKey);
        const imgFrame = imgTexture.getSourceImage();
        const thumbScale = Math.min(thumbMaxW / imgFrame.width, thumbMaxH / imgFrame.height);

        this.refImage = this.add.image(
            this.boardWidth + this.trayWidth / 2,
            height - 15 - (imgFrame.height * thumbScale) / 2,
            GAME_DATA.imageKey
        ).setScale(thumbScale).setAlpha(0.7).setDepth(2000);

        this.add.text(
            this.boardWidth + this.trayWidth / 2,
            this.refImage.y - (imgFrame.height * thumbScale) / 2 - 12,
            'Reference', {
            fontSize: '12px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#888'
        }).setOrigin(0.5).setDepth(2000);

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
