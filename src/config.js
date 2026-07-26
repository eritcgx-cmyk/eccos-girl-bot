require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || null,
  port: process.env.PORT || 8080,
  statusApiUrl: process.env.STATUS_API_URL || 'https://whatexpsare.online/api/status/exploits',
  colors: {
    primary: 0xFF69B4,    // Hot Pink (ecco's girl aesthetic)
    secondary: 0x9B59B6,  // Purple accent
    success: 0x2ECC71,    // Emerald Green
    warning: 0xF1C40F,    // Gold / Yellow
    danger: 0xE74C3C,     // Crimson Red
    info: 0x3498DB        // Blue
  }
};
