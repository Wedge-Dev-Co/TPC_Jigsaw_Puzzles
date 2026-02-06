require('dotenv').config();

module.exports = {
    port: parseInt(process.env.PORT, 10) || 3000,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    supportedImageFormats: ['.jpg', '.jpeg', '.png', '.webp']
};
