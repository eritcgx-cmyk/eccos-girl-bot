// src/status.js — Fetches exploit statuses with manual override support
const { readData, writeData } = require('./database/db');

const TRACKED = ['Volt', 'Synapse Z', 'Wave', 'Delta', 'Cosmic', 'Potassium'];

const FALLBACK = {
    'Volt':      { status: 'online',  note: 'Fully operational' },
    'Synapse Z': { status: 'online',  note: 'Fully operational' },
    'Wave':      { status: 'online',  note: 'Fully operational' },
    'Delta':     { status: 'online',  note: 'Fully operational' },
    'Cosmic':    { status: 'partial', note: 'Degraded / partial' },
    'Potassium': { status: 'online',  note: 'Fully operational' },
};

const WEAO_ENDPOINTS = [
    'https://whatexpsare.online/api/status/exploits',
    'https://api.weao.xyz/exploits',
    'https://whatexpsare.online/api/exploits',
];

let cachedData = null;
let cacheTime  = 0;
const CACHE_TTL = 30_000;

function getOverrides() {
    const data = readData();
    return data.status_overrides || {};
}

function setExploitOverride(name, statusObj) {
    const data = readData();
    data.status_overrides = data.status_overrides || {};
    data.status_overrides[name.toLowerCase()] = statusObj;
    writeData(data);
    cachedData = null; // Invalidate cache
}

function clearExploitOverride(name) {
    const data = readData();
    data.status_overrides = data.status_overrides || {};
    delete data.status_overrides[name.toLowerCase()];
    writeData(data);
    cachedData = null;
}

async function fetchExploitStatuses() {
    const overrides = getOverrides();

    let baseStatuses = [];

    // Return cache if fresh and no recent override changes
    if (cachedData && Date.now() - cacheTime < CACHE_TTL) {
        baseStatuses = cachedData;
    } else {
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

                const lookup = {};
                for (const item of items) {
                    const name = (item.title || item.name || '').toLowerCase().trim();
                    if (name && !lookup[name]) {
                        lookup[name] = item;
                    }
                }

                baseStatuses = TRACKED.map(name => {
                    const key = name.toLowerCase();
                    const item = lookup[key];
                    
                    let status = 'unknown';
                    let version = '';
                    let detected = false;

                    if (item) {
                        if (typeof item.updateStatus === 'boolean') {
                            status = item.updateStatus ? 'online' : 'offline';
                        } else if (item.status) {
                            status = normalizeStatus(item.status);
                        }
                        version = item.version || '';
                        detected = !!item.detected;
                    }

                    return {
                        name,
                        status,
                        version,
                        detected,
                        note: noteForStatus(status, detected),
                        fromApi: true,
                    };
                });

                cachedData = baseStatuses;
                cacheTime  = Date.now();
                break;
            } catch (_) {}
        }
    }

    if (!baseStatuses || !baseStatuses.length) {
        baseStatuses = TRACKED.map(name => ({
            name,
            status: FALLBACK[name]?.status || 'unknown',
            note:   FALLBACK[name]?.note   || 'Status unknown',
            fromApi: false,
        }));
    }

    // Apply any active manual overrides
    return baseStatuses.map(item => {
        const override = overrides[item.name.toLowerCase()];
        if (override) {
            return {
                ...item,
                status: override.status || item.status,
                detected: typeof override.detected === 'boolean' ? override.detected : item.detected,
                bypassing: typeof override.bypassing === 'boolean' ? override.bypassing : item.bypassing,
                note: override.note || noteForStatus(override.status || item.status, override.detected),
                isOverridden: true
            };
        }
        return item;
    });
}

function normalizeStatus(s) {
    if (!s) return 'unknown';
    s = String(s).toLowerCase();
    if (s === 'working' || s === 'online' || s === 'up' || s === 'operational' || s === 'true') return 'online';
    if (s === 'patched' || s === 'offline' || s === 'down' || s === 'broken' || s === 'false') return 'offline';
    if (s === 'partial' || s === 'degraded' || s === 'crashing') return 'partial';
    return 'unknown';
}

function noteForStatus(s, detected) {
    let note = '';
    switch (s) {
        case 'online':  note = 'Updated & working'; break;
        case 'offline': note = 'Patched / updating'; break;
        case 'partial': note = 'Degraded / partial'; break;
        default:        note = 'Status unknown'; break;
    }
    if (detected) {
        note += ' (Detected)';
    }
    return note;
}

module.exports = {
    fetchExploitStatuses,
    setExploitOverride,
    clearExploitOverride,
    TRACKED
};
