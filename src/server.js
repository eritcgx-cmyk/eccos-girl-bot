// src/server.js — Express Web Server with Discord OAuth Gate & Whitelist
const express = require('express');
const session = require('express-session');
const path = require('path');
const { fetchExploitStatuses } = require('./status');
const { readData, writeData } = require('./database/db');
const { getEmojiRules, setEmojiRules, syncStatusChannels } = require('./status-channels');
const { getWhitelistedUsers, isWhitelisted, addWhitelist, removeWhitelist } = require('./whitelist');
const { getClient } = require('./bot');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'eccos-girl-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

function getRedirectUri(req) {
    if (process.env.REDIRECT_URI) return process.env.REDIRECT_URI;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host');
    return `${protocol}://${host}/auth/discord/callback`;
}

// ── Middleware: Discord OAuth & Whitelist Gate ─────────────────────
function requireDiscordAuth(req, res, next) {
    const exempt = [
        '/login.html',
        '/access-denied.html',
        '/auth/discord',
        '/auth/discord/callback',
        '/api/me',
        '/invite',
        '/pfp.jpg',
        '/style.css'
    ];

    if (exempt.some(e => req.path.startsWith(e))) return next();

    // Check if logged in with Discord
    if (!req.session.discordUser) {
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ ok: false, error: 'Unauthorized' });
        }
        return res.redirect('/login.html');
    }

    const userId = req.session.discordUser.id;

    // Auto-whitelist first user if whitelist is empty
    const currentWl = getWhitelistedUsers();
    if (currentWl.length === 0) {
        addWhitelist(userId);
    }

    // Check whitelist status
    if (!isWhitelisted(userId)) {
        if (req.path.startsWith('/api/')) {
            return res.status(403).json({ ok: false, error: 'Forbidden: Not Whitelisted' });
        }
        return res.sendFile(path.join(__dirname, '../public/access-denied.html'));
    }

    next();
}

app.use(requireDiscordAuth);
app.use(express.static(path.join(__dirname, '../public')));

// ── API: User & Auth Status ─────────────────────────────────────────
app.get('/api/me', (req, res) => {
    const user = req.session.discordUser || null;
    const whitelisted = user ? isWhitelisted(user.id) : false;
    res.json({
        authenticated: !!user,
        whitelisted,
        discordUser: user
    });
});

// ── API: software status ───────────────────────────────────────────
app.get('/api/status', async (req, res) => {
    try {
        const statuses = await fetchExploitStatuses();
        res.json({ ok: true, data: statuses });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── API: Whitelist Management ─────────────────────────────────────
app.get('/api/dashboard/whitelist', (req, res) => {
    res.json({ ok: true, whitelist: getWhitelistedUsers() });
});

app.post('/api/dashboard/whitelist', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ ok: false, error: 'Missing userId' });
    addWhitelist(userId);
    res.json({ ok: true, whitelist: getWhitelistedUsers() });
});

app.delete('/api/dashboard/whitelist', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ ok: false, error: 'Missing userId' });
    removeWhitelist(userId);
    res.json({ ok: true, whitelist: getWhitelistedUsers() });
});

// ── API: Dashboard stats & control ────────────────────────────────
app.get('/api/dashboard/stats', (req, res) => {
    const client = getClient();
    const isOnline = client && client.isReady();

    res.json({
        ok: true,
        botStatus: isOnline ? 'online' : 'offline',
        botTag: isOnline ? client.user.tag : 'Not connected',
        guildsCount: isOnline ? client.guilds.cache.size : 0,
        uptimeSeconds: isOnline ? Math.floor(client.uptime / 1000) : 0,
        memoryMb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    });
});

app.post('/api/dashboard/emojis', (req, res) => {
    const { guildId, rules } = req.body;
    if (!rules) return res.status(400).json({ ok: false, error: 'Missing rules' });
    
    setEmojiRules(guildId || 'default', rules);
    const client = getClient();
    if (client) syncStatusChannels(client, true);

    res.json({ ok: true, rules: getEmojiRules(guildId || 'default') });
});

app.post('/api/dashboard/sync', async (req, res) => {
    const client = getClient();
    if (!client || !client.isReady()) {
        return res.status(503).json({ ok: false, error: 'Bot is not connected' });
    }
    await syncStatusChannels(client, true);
    res.json({ ok: true });
});

// ── Discord OAuth2 ─────────────────────────────────────────────────
app.get('/auth/discord', (req, res) => {
    if (!process.env.DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID === 'your_application_id_here') {
        return res.status(503).send('Discord OAuth not configured yet.');
    }

    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'identify',
    });

    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/login.html?error=no_code');

    try {
        const redirectUri = getRedirectUri(req);
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            })
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            console.error('[OAuth] Token error response:', tokenData);
            throw new Error(tokenData.error_description || 'No access token returned');
        }

        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const user = await userRes.json();

        req.session.discordUser = {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                : `https://cdn.discordapp.com/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`,
        };

        if (!isWhitelisted(user.id)) {
            const currentWl = getWhitelistedUsers();
            if (currentWl.length === 0) {
                addWhitelist(user.id);
                return res.redirect('/');
            }
            return res.redirect('/access-denied.html');
        }

        res.redirect('/');
    } catch (err) {
        console.error('[OAuth]', err);
        res.redirect('/login.html?error=oauth_failed');
    }
});

// ── Logout ──────────────────────────────────────────────────────────
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ ok: true });
});

// ── Dedicated /dashboard route ──────────────────────────────────────
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// ── Invite link ────────────────────────────────────────────────────
app.get('/invite', (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) return res.status(503).send('Invite not configured.');
    const params = new URLSearchParams({
        client_id: clientId,
        permissions: '8',
        scope: 'bot applications.commands'
    });
    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

// ── Catch-all ───────────────────────────────────────────────────────
app.get('*', (req, res) => {
    if (req.session.discordUser && isWhitelisted(req.session.discordUser.id)) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    } else if (req.session.discordUser) {
        res.sendFile(path.join(__dirname, '../public/access-denied.html'));
    } else {
        res.redirect('/login.html');
    }
});

function startServer() {
    return new Promise(resolve => {
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`[Web] Listening on port ${port}`);
            resolve();
        });
    });
}

module.exports = { startServer };
