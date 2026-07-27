// public/dashboard.js — Client logic for dedicated /dashboard page

document.addEventListener('DOMContentLoaded', () => {
    loadUserArea();
    loadDashboardStats();
    loadWhitelist();
    loadExecutorOverrides();

    document.getElementById('dashSyncBtn')?.addEventListener('click', triggerDashSync);
    document.getElementById('addWlForm')?.addEventListener('submit', handleAddWhitelist);
    document.getElementById('emojiForm')?.addEventListener('submit', saveEmojiForm);
    document.getElementById('announceForm')?.addEventListener('submit', handleSendAnnouncement);
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
            if (data.statuses) renderOverrideRows(data.statuses);
        }
    } catch {}
}

async function loadExecutorOverrides() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.ok && Array.isArray(data.data)) {
            renderOverrideRows(data.data);
        }
    } catch {}
}

function renderOverrideRows(statuses) {
    const container = document.getElementById('overrideGrid');
    if (!container) return;

    container.innerHTML = statuses.map(s => {
        const currentVal = s.bypassing ? 'bypassing' : s.detected ? 'detected' : s.status;
        return `
            <div class="override-row">
                <strong style="width: 100px;">${s.name}</strong>
                <select id="sel_${s.name.replace(/\s+/g, '')}">
                    <option value="online" ${currentVal === 'online' ? 'selected' : ''}>🟢 Undetected</option>
                    <option value="bypassing" ${currentVal === 'bypassing' ? 'selected' : ''}>🔵 Bypassing</option>
                    <option value="detected" ${currentVal === 'detected' ? 'selected' : ''}>🌕 Detected</option>
                    <option value="partial" ${currentVal === 'partial' ? 'selected' : ''}>🟣 Updating</option>
                    <option value="offline" ${currentVal === 'offline' ? 'selected' : ''}>🔴 Down / Patched</option>
                    <option value="reset">🔄 Auto API Sync</option>
                </select>
                <input type="text" id="note_${s.name.replace(/\s+/g, '')}" value="${s.note || ''}" placeholder="Custom note...">
                <button class="btn-main" style="padding: 6px 12px; font-size: 0.8rem;" onclick="saveOverride('${s.name}')">Save</button>
            </div>
        `;
    }).join('');
}

async function saveOverride(executor) {
    const key = executor.replace(/\s+/g, '');
    const statusType = document.getElementById(`sel_${key}`)?.value;
    const note = document.getElementById(`note_${key}`)?.value;

    try {
        const res = await fetch('/api/dashboard/override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ executor, statusType, note })
        });
        const data = await res.json();
        if (data.ok) {
            alert(`✅ Saved status override for ${executor}!`);
            loadDashboardStats();
        } else {
            alert('❌ ' + data.error);
        }
    } catch {
        alert('❌ Error saving override');
    }
}

async function handleSendAnnouncement(e) {
    e.preventDefault();
    const title = document.getElementById('annTitle').value.trim();
    const message = document.getElementById('annMsg').value.trim();

    if (!title || !message) return;

    try {
        const res = await fetch('/api/dashboard/announce', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, message })
        });
        const data = await res.json();
        if (data.ok) {
            alert(`✅ Sent announcement to ${data.sentCount} Discord server(s)!`);
            document.getElementById('annTitle').value = '';
            document.getElementById('annMsg').value = '';
        } else {
            alert('❌ ' + data.error);
        }
    } catch {
        alert('❌ Error sending announcement');
    }
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
