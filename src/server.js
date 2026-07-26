// src/server.js — Express web server
// Handles: static site, password gate, Discord OAuth2

const express = require('express');
const session = require('express-session');
const path = require('path');
const { fetchExploitStatuses } = require('./status');

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

// ── Middleware: check password ─────────────────────────────────────
function requireAuth(req, res, next) {
    // API routes used by the gate page itself are exempt
    const exempt = ['/api/verify-password', '/auth/discord', '/auth/discord/callback'];
    if (exempt.some(e => req.path.startsWith(e))) return next();

    // Static assets don't require auth
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') return next();

    if (!req.session.authenticated) {
        // Send the gate page instead
        return res.sendFile(path.join(__dirname, '../public/gate.html'));
    }
    next();
}

app.use(requireAuth);

// ── Static files ───────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── API: verify password ────────────────────────────────────────────
app.post('/api/verify-password', (req, res) => {
    const { password } = req.body;
    const correct = process.env.SITE_PASSWORD || 'eccosgirl';

    if (password === correct) {
        req.session.authenticated = true;
        return res.json({ ok: true });
    }
    return res.status(401).json({ ok: false, error: 'Wrong password' });
});

// ── API: check auth status ──────────────────────────────────────────
app.get('/api/me', (req, res) => {
    res.json({
        authenticated: !!req.session.authenticated,
        discordUser: req.session.discordUser || null
    });
});

// ── API: software status (proxy WEAO, filter to our 6) ─────────────
app.get('/api/status', async (req, res) => {
    try {
        const statuses = await fetchExploitStatuses();
        res.json({ ok: true, data: statuses });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── Discord OAuth2 ─────────────────────────────────────────────────
app.get('/auth/discord', (req, res) => {
    if (!process.env.DISCORD_CLIENT_ID) {
        return res.status(503).send('Discord OAuth not configured.');
    }

    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: process.env.REDIRECT_URI || `${process.env.BASE_URL}/auth/discord/callback`,
        response_type: 'code',
        scope: 'identify',
    });

    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/?error=no_code');

    try {
        // Exchange code for token
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.REDIRECT_URI || `${process.env.BASE_URL}/auth/discord/callback`,
            })
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error('No access token returned');

        // Fetch user info
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

        res.redirect('/?linked=1');
    } catch (err) {
        console.error('[OAuth]', err);
        res.redirect('/?error=oauth_failed');
    }
});

// ── Logout ──────────────────────────────────────────────────────────
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ ok: true });
});

// ── Invite link ────────────────────────────────────────────────────
app.get('/invite', (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId || clientId === 'your_application_id_here') {
        return res.status(503).send('Invite not configured yet. Set DISCORD_CLIENT_ID in env.');
    }
    const params = new URLSearchParams({
        client_id: clientId,
        permissions: '8', // Administrator — you can restrict this
        scope: 'bot applications.commands'
    });
    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

// ── Catch-all → index ───────────────────────────────────────────────
app.get('*', (req, res) => {
    if (req.session.authenticated) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    } else {
        res.sendFile(path.join(__dirname, '../public/gate.html'));
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
