const axios = require('axios');
const config = require('../config');

/**
 * Fetches software/executor status from whatexpsare.online API (/api/status/exploits)
 */
async function fetchSoftwareStatus() {
  try {
    const response = await axios.get(config.statusApiUrl, {
      headers: {
        'User-Agent': 'eccos-girl-discord-bot/1.0',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data) {
      return {
        success: true,
        data: response.data,
        timestamp: new Date()
      };
    }
  } catch (error) {
    console.error('❌ Failed to fetch from whatexpsare.online status API:', error.message);
  }

  return {
    success: false,
    error: 'API unavailable',
    timestamp: new Date()
  };
}

/**
 * Formats API data into categorized software lists
 */
function parseStatusData(apiResult) {
  if (!apiResult.success || !apiResult.data || !Array.isArray(apiResult.data)) {
    return {
      statusText: '⚠️ Status service temporarily unavailable.',
      categorized: null,
      timestamp: apiResult.timestamp
    };
  }

  const items = apiResult.data;

  const categorized = {
    windows: [],
    android: [],
    mac: [],
    ios: [],
    other: []
  };

  items.forEach(item => {
    const name = item.title || item.name || 'Unknown Software';
    const isWorking = item.updateStatus === true;
    const version = item.version || 'N/A';
    const platform = (item.platform || 'Windows').toLowerCase();
    const isFree = item.free === true ? 'Free' : (item.cost || 'Paid');
    const unc = item.uncPercentage !== undefined ? `${item.uncPercentage}%` : 'N/A';

    const entry = {
      name,
      status: isWorking ? '🟢 Working' : '🔴 Patched',
      version,
      free: isFree,
      unc,
      detected: item.detected === true ? '⚠️ Detected' : '🛡️ Undetected'
    };

    if (platform.includes('win')) categorized.windows.push(entry);
    else if (platform.includes('android')) categorized.android.push(entry);
    else if (platform.includes('mac')) categorized.mac.push(entry);
    else if (platform.includes('ios')) categorized.ios.push(entry);
    else categorized.other.push(entry);
  });

  return {
    categorized,
    timestamp: apiResult.timestamp
  };
}

module.exports = {
  fetchSoftwareStatus,
  parseStatusData
};
