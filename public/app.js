// public/app.js — website client script

document.addEventListener('DOMContentLoaded', () => {
    loadUserArea();
    loadStatus();
    renderNews();

    document.getElementById('refreshBtn')?.addEventListener('click', () => loadStatus(true));
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});

// ── User area (Discord link) ────────────────────────────────────────
async function loadUserArea() {
    const area = document.getElementById('userArea');
    if (!area) return;

    try {
        const res  = await fetch('/api/me');
        const data = await res.json();

        if (data.discordUser) {
            const u = data.discordUser;
            area.innerHTML = `
                <img src="${u.avatar}" alt="${u.username}" onerror="this.style.display='none'">
                <span>${u.username}</span>
            `;
        } else {
            area.innerHTML = `<button class="link-discord-btn" onclick="window.location.href='/auth/discord'">link discord</button>`;
        }
    } catch {
        area.innerHTML = `<button class="link-discord-btn" onclick="window.location.href='/auth/discord'">link discord</button>`;
    }

    // Handle ?linked=1 or ?error=...
    const params = new URLSearchParams(location.search);
    if (params.get('linked') === '1') {
        history.replaceState({}, '', '/');
    }
}

// ── Status grid ─────────────────────────────────────────────────────
async function loadStatus(manual = false) {
    const grid    = document.getElementById('statusGrid');
    const updated = document.getElementById('lastUpdate');
    const btn     = document.getElementById('refreshBtn');

    if (manual && btn) btn.classList.add('spin');

    try {
        const res  = await fetch('/api/status');
        const data = await res.json();

        if (!data.ok) throw new Error(data.error);

        grid.innerHTML = data.data.map(item => `
            <div class="status-card">
                <span class="s-dot ${item.status}"></span>
                <span class="s-name">${esc(item.name)}</span>
                <span class="s-tag ${item.status}">${item.status}</span>
            </div>
        `).join('');

        if (updated) updated.textContent = 'updated ' + new Date().toLocaleTimeString();
    } catch {
        if (grid.children.length && !grid.querySelector('.skel')) return; // don't replace real data on error
        grid.innerHTML = '<p style="color:#7a6e8a;font-size:0.85rem;grid-column:1/-1">could not load statuses right now</p>';
    } finally {
        if (btn) btn.classList.remove('spin');
    }
}

// Auto-refresh every 60 seconds
setInterval(loadStatus, 60_000);

// ── Logout ──────────────────────────────────────────────────────────
async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.reload();
}

// ── News ────────────────────────────────────────────────────────────
const NEWS = [
    {
        type: 'update',
        tag: 'update',
        title: 'v2.0 is out',
        date: 'jul 26, 2026',
        body: 'big rewrite. everything works better now.',
        bullets: ['new status tracker for volt, synapse z, wave, delta, cosmic, potassium', 'slash commands overhauled', 'website now password gated', 'discord oauth so you can link your account']
    },
    {
        type: 'feature',
        tag: 'new',
        title: 'roblox status tracking added',
        date: 'jul 20, 2026',
        body: 'use /statusall in discord to see all 6 executors at once. /status [name] for a specific one.',
        bullets: []
    },
    {
        type: 'fix',
        tag: 'fix',
        title: 'command bugs patched',
        date: 'jul 15, 2026',
        body: 'various fixes',
        bullets: ['purge command now handles edge cases correctly', 'ban command no longer errors on missing optional fields', 'status fetcher fallback improved']
    },
];

function renderNews() {
    const list = document.getElementById('newsList');
    if (!list) return;

    list.innerHTML = NEWS.map(n => {
        const bullets = n.bullets.length
            ? `<ul>${n.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
            : '';
        return `
            <div class="news-card news-${n.type}">
                <div class="news-header">
                    <span class="news-tag">${esc(n.tag)}</span>
                    <span class="news-title">${esc(n.title)}</span>
                    <span class="news-date">${esc(n.date)}</span>
                </div>
                <div class="news-body">${esc(n.body)}${bullets}</div>
            </div>
        `;
    }).join('');
}

// ── Util ─────────────────────────────────────────────────────────────
function esc(s) {
    return String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}
