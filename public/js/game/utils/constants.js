const CONSTANTS = {
    SNAP_THRESHOLD: 30,
    TAB_SIZE: 0.2,          // Tab size as fraction of piece dimension
    BOARD_RATIO: 0.65,      // Board takes 65% of width
    TRAY_RATIO: 0.35,       // Tray takes 35% of width
    BG_COLOR: 0x1a1a2e,
    BOARD_COLOR: 0x16213e,
    TRAY_COLOR: 0x0f3460,
    GRID_SIZES: {
        '9':  { cols: 3, rows: 3 },
        '16': { cols: 4, rows: 4 },
        '25': { cols: 5, rows: 5 },
        '36': { cols: 6, rows: 6 },
        '49': { cols: 7, rows: 7 },
        '500': { cols: 25, rows: 20 }
    },
    DEFAULT_PIECES: 25
};
