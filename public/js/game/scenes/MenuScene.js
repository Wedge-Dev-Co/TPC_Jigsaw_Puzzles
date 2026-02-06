class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, CONSTANTS.BG_COLOR);

        // Title
        const title = GAME_DATA.title || GAME_DATA.puzzleId.replace(/[-_]/g, ' ');
        this.add.text(width / 2, 50, title, {
            fontSize: '32px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#e0c097',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Puzzle preview image
        const imgTexture = this.textures.get(GAME_DATA.imageKey);
        const imgFrame = imgTexture.getSourceImage();
        const previewMaxW = Math.min(360, width * 0.5);
        const previewMaxH = Math.min(240, height * 0.35);
        const previewScale = Math.min(previewMaxW / imgFrame.width, previewMaxH / imgFrame.height);

        const preview = this.add.image(width / 2, 200, GAME_DATA.imageKey);
        preview.setScale(previewScale);

        // Difficulty section
        const diffY = 340;
        this.add.text(width / 2, diffY, 'Select Difficulty', {
            fontSize: '20px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#aaa'
        }).setOrigin(0.5);

        const difficulties = [
            { pieces: 9,  label: 'Easy (3x3)' },
            { pieces: 16, label: 'Medium (4x4)' },
            { pieces: 25, label: 'Standard (5x5)' },
            { pieces: 36, label: 'Hard (6x6)' },
            { pieces: 49, label: 'Expert (7x7)' },
            { pieces: 500, label: 'Extreme (25x20)' }
        ];

        const btnWidth = 140;
        const btnHeight = 44;
        const btnGap = 12;
        const totalBtnsW = difficulties.length * btnWidth + (difficulties.length - 1) * btnGap;
        let startX = width / 2 - totalBtnsW / 2 + btnWidth / 2;

        // If buttons would overflow, stack vertically
        const stackVertically = totalBtnsW > width - 40;

        difficulties.forEach((diff, i) => {
            let bx, by;
            if (stackVertically) {
                bx = width / 2;
                by = diffY + 50 + i * (btnHeight + btnGap);
            } else {
                bx = startX + i * (btnWidth + btnGap);
                by = diffY + 60;
            }

            const isSelected = diff.pieces === GAME_DATA.pieceCount;

            const bg = this.add.rectangle(bx, by, btnWidth, btnHeight,
                isSelected ? 0xe0c097 : 0x16213e
            ).setInteractive({ useHandCursor: true });

            const txt = this.add.text(bx, by, diff.label, {
                fontSize: '16px',
                fontFamily: 'Segoe UI, sans-serif',
                color: isSelected ? '#1a1a2e' : '#e0c097'
            }).setOrigin(0.5);

            bg.on('pointerover', () => {
                if (!isSelected) bg.setFillStyle(0x0f3460);
            });
            bg.on('pointerout', () => {
                if (!isSelected) bg.setFillStyle(0x16213e);
            });
            bg.on('pointerdown', () => {
                // Update game data with new difficulty
                GAME_DATA.pieceCount = diff.pieces;
                const grid = CONSTANTS.GRID_SIZES[diff.pieces];
                GAME_DATA.gridCols = grid.cols;
                GAME_DATA.gridRows = grid.rows;
                this.scene.start('PuzzleScene');
            });
        });

        // Play button (uses current/default difficulty)
        const playY = stackVertically
            ? diffY + 50 + difficulties.length * (btnHeight + btnGap) + 30
            : diffY + 140;

        const playBg = this.add.rectangle(width / 2, playY, 200, 56, 0xe0c097)
            .setInteractive({ useHandCursor: true });

        this.add.text(width / 2, playY, 'Play!', {
            fontSize: '24px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#1a1a2e',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        playBg.on('pointerover', () => playBg.setFillStyle(0xc9a77d));
        playBg.on('pointerout', () => playBg.setFillStyle(0xe0c097));
        playBg.on('pointerdown', () => {
            this.scene.start('PuzzleScene');
        });
    }
}
