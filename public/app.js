// public/app.js — website client script

document.addEventListener('DOMContentLoaded', () => {
    loadUserArea();
    loadStatus();
    loadDashboardStats();
    renderNews();

    document.getElementById('refreshBtn')?.addEventListener('click', () => loadStatus(true));
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('dashSyncBtn')?.addEventListener('click', triggerDashSync);
    document.getElementById('emojiForm')?.addEventListener('submit', saveEmojiForm);
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
                <div class="s-info">
                    <span class="s-name">${esc(item.name)}</span>
                    <span class="s-sub">${esc(item.note || item.version || '')}</span>
                </div>
                <span class="s-tag ${item.status}">${item.status}</span>
            </div>
        `).join('');

        if (updated) updated.textContent = 'updated ' + new Date().toLocaleTimeString();
    } catch {
        if (grid.children.length && !grid.querySelector('.skel')) return;
        grid.innerHTML = '<p style="color:#7a6e8a;font-size:0.85rem;grid-column:1/-1">could not load statuses right now</p>';
    } finally {
        if (btn) btn.classList.remove('spin');
    }
}

setInterval(loadStatus, 60_000);

// ── Dashboard Control ────────────────────────────────────────────────
async function loadDashboardStats() {
    try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();

        if (data.ok) {
            const statusEl = document.getElementById('dashBotStatus');
            const tagEl    = document.getElementById('dashBotTag');
            const countEl  = document.getElementById('dashGuildsCount');
            const memEl    = document.getElementById('dashMemory');

            if (statusEl) {
                statusEl.textContent = data.botStatus;
                statusEl.className = `s-tag ${data.botStatus === 'online' ? 'online' : 'offline'}`;
            }
            if (tagEl) tagEl.textContent = data.botTag;
            if (countEl) countEl.textContent = data.guildsCount;
            if (memEl) memEl.textContent = data.memoryMb + ' MB';
        }
    } catch (e) {
        console.warn('Dashboard stats error:', e);
    }
}

async function triggerDashSync() {
    const btn = document.getElementById('dashSyncBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Syncing...';
    }

    try {
        const res = await fetch('/api/dashboard/sync', { method: 'POST' });
        const data = await res.json();
        if (data.ok) {
            alert('✅ Status channels synchronized successfully!');
        } else {
            alert('❌ ' + (data.error || 'Failed to sync'));
        }
    } catch (e) {
        alert('❌ Error connecting to server');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '⚡ Sync Status Channels Now';
        }
    }
}

async function saveEmojiForm(e) {
    e.preventDefault();
    const rules = {
        undetected: document.getElementById('emojiUndetected')?.value || '🟢',
        bypassing:  document.getElementById('emojiBypassing')?.value  || '🔵',
        detected:   document.getElementById('emojiDetected')?.value   || '🌕',
        updating:   document.getElementById('emojiUpdating')?.value   || '🟣',
        down:       document.getElementById('emojiDown')?.value       || '🔴',
    };

    try {
        const res = await fetch('/api/dashboard/emojis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId: 'default', rules })
        });
        const data = await res.json();
        if (data.ok) {
            alert('✅ Emoji configuration saved and status channels synced!');
        }
    } catch (err) {
        alert('❌ Failed to save emoji rules');
    }
}

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
        title: 'v2.5 — Dynamic Status Channels & Dashboard Live!',
        date: 'jul 26, 2026',
        body: 'major update featuring dynamic status channels and control dashboard.',
        bullets: ['auto-renaming Discord voice/text status channels (🟢, 🔵, 🌕, 🟣, 🔴)', 'control dashboard added to website', '20 new commands added (utility, server management, fun)']
    },
    {
        type: 'feature',
        tag: 'new',
        title: 'roblox status tracking added',
        date: 'jul 20, 2026',
        body: 'use /statusall in discord to see all 6 executors at once. /status [name] for a specific one.',
        bullets: []
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
