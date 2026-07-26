const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/db.json');
const dataDir = path.dirname(dbPath);

const defaultData = {
  guild_settings: {},
  tickets: [],
  loadstrings: []
};

function ensureDbExists() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
  }
}

function readData() {
  ensureDbExists();
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading db.json, returning default:', e.message);
    return defaultData;
  }
}

function writeData(data) {
  ensureDbExists();
  try {
    const tempPath = `${dbPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
    fs.renameSync(tempPath, dbPath);
  } catch (e) {
    console.error('Error writing to db.json:', e.message);
  }
}

ensureDbExists();
console.log('✅ Persistent Storage Engine initialized at:', dbPath);

module.exports = {
  readData,
  writeData
};
