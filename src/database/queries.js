const { readData, writeData } = require('./db');

module.exports = {
  // Guild Settings
  getGuildSettings(guildId) {
    const db = readData();
    return db.guild_settings[guildId] || null;
  },

  setWelcomeSettings(guildId, channelId, message) {
    const db = readData();
    if (!db.guild_settings[guildId]) db.guild_settings[guildId] = {};
    db.guild_settings[guildId].welcome_channel_id = channelId;
    db.guild_settings[guildId].welcome_message = message;
    db.guild_settings[guildId].updated_at = new Date().toISOString();
    writeData(db);
    return true;
  },

  setStatusChannel(guildId, channelId, messageId = null) {
    const db = readData();
    if (!db.guild_settings[guildId]) db.guild_settings[guildId] = {};
    db.guild_settings[guildId].status_channel_id = channelId;
    db.guild_settings[guildId].status_message_id = messageId;
    db.guild_settings[guildId].updated_at = new Date().toISOString();
    writeData(db);
    return true;
  },

  updateStatusMessageId(guildId, messageId) {
    const db = readData();
    if (db.guild_settings[guildId]) {
      db.guild_settings[guildId].status_message_id = messageId;
      writeData(db);
    }
  },

  setTicketSettings(guildId, categoryId, logChannelId) {
    const db = readData();
    if (!db.guild_settings[guildId]) db.guild_settings[guildId] = {};
    db.guild_settings[guildId].ticket_category_id = categoryId;
    db.guild_settings[guildId].ticket_log_channel_id = logChannelId;
    db.guild_settings[guildId].updated_at = new Date().toISOString();
    writeData(db);
    return true;
  },

  getAllStatusChannels() {
    const db = readData();
    const results = [];
    for (const [guildId, settings] of Object.entries(db.guild_settings)) {
      if (settings.status_channel_id) {
        results.push({
          guild_id: guildId,
          status_channel_id: settings.status_channel_id,
          status_message_id: settings.status_message_id
        });
      }
    }
    return results;
  },

  // Tickets
  createTicket(guildId, channelId, userId) {
    const db = readData();
    const ticket = {
      id: db.tickets.length + 1,
      guild_id: guildId,
      channel_id: channelId,
      user_id: userId,
      status: 'open',
      claimed_by: null,
      created_at: new Date().toISOString()
    };
    db.tickets.push(ticket);
    writeData(db);
    return ticket;
  },

  getTicketByChannel(channelId) {
    const db = readData();
    return db.tickets.find(t => t.channel_id === channelId && t.status === 'open') || null;
  },

  claimTicket(channelId, staffId) {
    const db = readData();
    const ticket = db.tickets.find(t => t.channel_id === channelId && t.status === 'open');
    if (ticket) {
      ticket.claimed_by = staffId;
      writeData(db);
      return true;
    }
    return false;
  },

  closeTicket(channelId) {
    const db = readData();
    const ticket = db.tickets.find(t => t.channel_id === channelId && t.status === 'open');
    if (ticket) {
      ticket.status = 'closed';
      ticket.closed_at = new Date().toISOString();
      writeData(db);
      return true;
    }
    return false;
  },

  // Loadstrings
  addLoadstring(name, code, description, authorId) {
    const db = readData();
    const existingIndex = db.loadstrings.findIndex(l => l.name.toLowerCase() === name.toLowerCase());
    const newEntry = {
      name,
      code,
      description,
      author_id: authorId,
      created_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      db.loadstrings[existingIndex] = newEntry;
    } else {
      db.loadstrings.push(newEntry);
    }
    writeData(db);
    return true;
  },

  getLoadstring(name) {
    const db = readData();
    return db.loadstrings.find(l => l.name.toLowerCase() === name.toLowerCase()) || null;
  },

  getAllLoadstrings() {
    const db = readData();
    return db.loadstrings.sort((a, b) => a.name.localeCompare(b.name));
  },

  deleteLoadstring(name) {
    const db = readData();
    const initialLength = db.loadstrings.length;
    db.loadstrings = db.loadstrings.filter(l => l.name.toLowerCase() !== name.toLowerCase());
    if (db.loadstrings.length !== initialLength) {
      writeData(db);
      return { changes: 1 };
    }
    return { changes: 0 };
  }
};
