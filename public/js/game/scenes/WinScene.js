class WinScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WinScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Show the completed puzzle image centered
        const imgTexture = this.textures.get(GAME_DATA.imageKey);
        const imgFrame = imgTexture.getSourceImage();
        const padding = 80;
        const imgScale = Math.min(
            (width - padding * 2) / imgFrame.width,
            (height - padding * 2) / imgFrame.height
        );
        this.add.image(width / 2, height / 2, GAME_DATA.imageKey)
            .setScale(imgScale)
            .setAlpha(0.4);

        // Overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);

        // Victory text with animation
        const winText = this.add.text(width / 2, height / 2 - 50, 'Puzzle Complete!', {
            fontSize: '48px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#e0c097',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: winText,
            alpha: 1,
            y: height / 2 - 60,
            duration: 600,
            ease: 'Power2'
        });

        const pieceText = this.add.text(width / 2, height / 2, `${GAME_DATA.pieceCount} pieces`, {
            fontSize: '20px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#aaa'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: pieceText,
            alpha: 1,
            delay: 300,
            duration: 400,
            ease: 'Power2'
        });

        // Play Again button
        const btnY = height / 2 + 60;
        const btnBg = this.add.rectangle(width / 2, btnY, 200, 50, 0xe0c097)
            .setInteractive({ useHandCursor: true })
            .setAlpha(0);

        const btnText = this.add.text(width / 2, btnY, 'Play Again', {
            fontSize: '22px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#1a1a2e',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [btnBg, btnText],
            alpha: 1,
            delay: 600,
            duration: 400,
            ease: 'Power2'
        });

        btnBg.on('pointerover', () => btnBg.setFillStyle(0xc9a77d));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0xe0c097));
        btnBg.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}
