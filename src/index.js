const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Initialize Express server for cloud hosting health check / keep-alive
const app = express();
app.get('/', (req, res) => {
  res.send('💖 ecco\'s girl Discord bot is online and running!');
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.listen(config.port, () => {
  console.log(`🌐 Web server running on port ${config.port} for hosting keep-alive.`);
});

// Initialize Discord Client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Load Commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

// Load Events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Global Uncaught Exception Protection
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Connect to Discord
if (!config.token) {
  console.error('❌ DISCORD_TOKEN is missing! Please configure your .env file or environment variables before running.');
} else {
  client.login(config.token).catch(err => {
    console.error('❌ Failed to log in to Discord:', err.message);
  });
}
