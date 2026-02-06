class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const { width, height } = this.scale;
        const barW = Math.min(400, width * 0.6);
        const barH = 30;
        const barX = (width - barW) / 2;
        const barY = height / 2 - barH / 2;

        this.add.text(width / 2, barY - 30, 'Loading puzzle...', {
            fontSize: '18px',
            color: '#e0c097'
        }).setOrigin(0.5);

        const bgBar = this.add.graphics();
        bgBar.fillStyle(0x16213e, 1);
        bgBar.fillRect(barX, barY, barW, barH);

        const progressBar = this.add.graphics();
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xe0c097, 1);
            progressBar.fillRect(barX + 4, barY + 4, (barW - 8) * value, barH - 8);
        });

        // GAME_DATA.imageUrl is set by main.js after fetching puzzle info
        this.load.image('puzzle-image', GAME_DATA.imageUrl);
    }

    create() {
        GAME_DATA.imageKey = 'puzzle-image';
        this.scene.start('MenuScene');
    }
}
