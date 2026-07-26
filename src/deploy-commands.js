// src/deploy-commands.js
// Run this once to register slash commands with Discord:
//   node src/deploy-commands.js
//
// Run it again whenever you add/change commands.

require('dotenv').config();
const { REST, Routes } = require('@discordjs/rest');
const fs = require('fs');
const path = require('path');

const commands = [];
const cmdDir = path.join(__dirname, 'commands');
const files = fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'));

for (const file of files) {
    const cmd = require(path.join(cmdDir, file));
    if (cmd.data) {
        commands.push(cmd.data.toJSON());
        console.log(`Queued: /${cmd.data.name}`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`\nDeploying ${commands.length} commands...`);

        // Guild commands update instantly. Global commands take up to 1 hour.
        // Use guild for testing, global for production.
        if (process.env.DISCORD_GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
                { body: commands }
            );
            console.log(`✅ Registered to guild ${process.env.DISCORD_GUILD_ID} (instant)`);
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commands }
            );
            console.log('✅ Registered globally (may take up to 1 hour)');
        }
    } catch (err) {
        console.error('❌ Deploy failed:', err);
    }
})();
