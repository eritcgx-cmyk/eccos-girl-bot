// public/dashboard.js — Client logic for dedicated /dashboard page

document.addEventListener('DOMContentLoaded', () => {
    loadUserArea();
    loadDashboardStats();
    loadWhitelist();

    document.getElementById('dashSyncBtn')?.addEventListener('click', triggerDashSync);
    document.getElementById('addWlForm')?.addEventListener('submit', handleAddWhitelist);
    document.getElementById('emojiForm')?.addEventListener('submit', saveEmojiForm);
});

async function loadUserArea() {
    const area = document.getElementById('userArea');
    if (!area) return;
    try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.discordUser) {
            area.innerHTML = `
                <img src="${data.discordUser.avatar}" alt="" onerror="this.style.display='none'">
                <span>${data.discordUser.username}</span>
            `;
        }
    } catch {}
}

async function loadDashboardStats() {
    try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        if (data.ok) {
            document.getElementById('dashBotStatus').textContent = data.botStatus;
            document.getElementById('dashBotTag').textContent = data.botTag;
            document.getElementById('dashGuildsCount').textContent = data.guildsCount;
            document.getElementById('dashMemory').textContent = data.memoryMb + ' MB';
        }
    } catch {}
}

async function loadWhitelist() {
    const container = document.getElementById('whitelistContainer');
    if (!container) return;

    try {
        const res = await fetch('/api/dashboard/whitelist');
        const data = await res.json();
        if (data.ok && Array.isArray(data.whitelist)) {
            if (data.whitelist.length === 0) {
                container.innerHTML = '<div class="wl-item">No user IDs whitelisted</div>';
                return;
            }
            container.innerHTML = data.whitelist.map(id => `
                <div class="wl-item">
                    <span>${id}</span>
                    <button class="wl-del-btn" onclick="removeWl('${id}')">Remove</button>
                </div>
            `).join('');
        }
    } catch {
        container.innerHTML = '<div class="wl-item">Error loading whitelist</div>';
    }
}

async function handleAddWhitelist(e) {
    e.preventDefault();
    const input = document.getElementById('wlInput');
    const userId = input.value.trim();
    if (!userId) return;

    try {
        const res = await fetch('/api/dashboard/whitelist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        const data = await res.json();
        if (data.ok) {
            input.value = '';
            loadWhitelist();
        } else {
            alert('❌ ' + (data.error || 'Failed to add user ID'));
        }
    } catch {
        alert('❌ Network error');
    }
}

async function removeWl(userId) {
    if (!confirm(`Remove user ID ${userId} from whitelist?`)) return;
    try {
        const res = await fetch('/api/dashboard/whitelist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        const data = await res.json();
        if (data.ok) loadWhitelist();
    } catch {}
}

async function triggerDashSync() {
    const btn = document.getElementById('dashSyncBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Syncing...'; }
    try {
        const res = await fetch('/api/dashboard/sync', { method: 'POST' });
        const data = await res.json();
        if (data.ok) alert('✅ Status channels synchronized!');
        else alert('❌ ' + data.error);
    } catch {
        alert('❌ Error connecting to server');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '⚡ Sync Status Channels'; }
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
        if (data.ok) alert('✅ Emoji configuration saved!');
    } catch {
        alert('❌ Error saving rules');
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
}
