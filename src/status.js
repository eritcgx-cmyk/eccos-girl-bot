// src/status.js — Fetches exploit statuses from WEAO API
// Only tracks: Volt, Synapse Z, Wave, Delta, Cosmic, Potassium

const TRACKED = ['Volt', 'Synapse Z', 'Wave', 'Delta', 'Cosmic', 'Potassium'];

// Fallback static data (shown when API is unreachable)
const FALLBACK = {
    'Volt':      { status: 'online',  note: 'Fully operational' },
    'Synapse Z': { status: 'online',  note: 'Fully operational' },
    'Wave':      { status: 'online',  note: 'Fully operational' },
    'Delta':     { status: 'online',  note: 'Fully operational' },
    'Cosmic':    { status: 'partial', note: 'Degraded / partial' },
    'Potassium': { status: 'online',  note: 'Fully operational' },
};

const WEAO_ENDPOINTS = [
    'https://api.weao.xyz/exploits',
    'https://whatexpsare.online/api/status/exploits',
    'https://whatexpsare.online/api/exploits',
];

let cachedData = null;
let cacheTime  = 0;
const CACHE_TTL = 60_000; // 60 seconds

async function fetchExploitStatuses() {
    // Return cache if fresh
    if (cachedData && Date.now() - cacheTime < CACHE_TTL) return cachedData;

    for (const url of WEAO_ENDPOINTS) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);

            if (!res.ok) continue;
            const raw = await res.json();

            const items = Array.isArray(raw) ? raw : raw.exploits || raw.data || [];
            if (!items.length) continue;

            // Build a name → status lookup (case-insensitive)
            const lookup = {};
            for (const item of items) {
                const name = (item.name || item.title || '').toLowerCase().trim();
                lookup[name] = (item.status || item.state || 'unknown').toLowerCase();
            }

            // Map our tracked names
            const result = TRACKED.map(name => {
                const key = name.toLowerCase();
                const raw_status = lookup[key] || 'unknown';
                return {
                    name,
                    status: normalizeStatus(raw_status),
                    note:   noteForStatus(normalizeStatus(raw_status)),
                    fromApi: true,
                };
            });

            cachedData = result;
            cacheTime  = Date.now();
            return result;
        } catch (_) {
            // Try next endpoint
        }
    }

    // All failed — return fallback
    console.warn('[Status] All WEAO endpoints failed, using fallback');
    const result = TRACKED.map(name => ({
        name,
        status: FALLBACK[name]?.status || 'unknown',
        note:   FALLBACK[name]?.note   || 'Status unknown',
        fromApi: false,
    }));
    cachedData = result;
    cacheTime  = Date.now();
    return result;
}

function normalizeStatus(s) {
    if (!s) return 'unknown';
    s = s.toLowerCase();
    if (s === 'working' || s === 'online' || s === 'up' || s === 'operational') return 'online';
    if (s === 'patched' || s === 'offline' || s === 'down' || s === 'broken') return 'offline';
    if (s === 'partial' || s === 'degraded' || s === 'crashing') return 'partial';
    return 'unknown';
}

function noteForStatus(s) {
    switch (s) {
        case 'online':  return 'Fully operational';
        case 'offline': return 'Currently patched / down';
        case 'partial': return 'Degraded / crashing';
        default:        return 'Status unknown';
    }
}

module.exports = { fetchExploitStatuses, TRACKED };
