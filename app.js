/* ==========================================================================
   ecco's girl — App Script
   Handles: particles, navbar scroll, status fetching, commands table,
            announcements, counter animations, reveals, mobile menu
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavbar();
    initMobileMenu();
    initCounterAnimations();
    initScrollReveal();
    initStatusCards();
    initCommandsTable();
    initAnnouncementsList();
    initCmdFilter();
    initRefreshBtn();
});

/* ─────────────────────────────────────────────────────
   1. Particle Canvas
───────────────────────────────────────────────────── */
function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, particles = [];
    const COLORS = ['#c467ff', '#ff6eb4', '#6eb4ff', '#6effb4'];

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function spawn() {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.8 + 0.4,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            alpha: Math.random() * 0.5 + 0.1,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
    }

    for (let i = 0; i < 140; i++) particles.push(spawn());

    function draw() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();

            p.x += p.vx;
            p.y += p.vy;

            // Wrap around edges
            if (p.x < -5) p.x = W + 5;
            if (p.x > W + 5) p.x = -5;
            if (p.y < -5) p.y = H + 5;
            if (p.y > H + 5) p.y = -5;
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }
    draw();
}

/* ─────────────────────────────────────────────────────
   2. Navbar scroll effect
───────────────────────────────────────────────────── */
function initNavbar() {
    const nav = document.getElementById('navbar');
    const onScroll = () => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* ─────────────────────────────────────────────────────
   3. Mobile menu hamburger toggle
───────────────────────────────────────────────────── */
function initMobileMenu() {
    const btn  = document.getElementById('hamburger');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        btn.classList.toggle('open');
        menu.classList.toggle('open');
    });

    // Close when clicking a link
    menu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            btn.classList.remove('open');
            menu.classList.remove('open');
        });
    });
}

/* ─────────────────────────────────────────────────────
   4. Animated counter numbers in hero
───────────────────────────────────────────────────── */
function initCounterAnimations() {
    const nums = document.querySelectorAll('.stat-num[data-count]');
    if (!nums.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-count'));
            animateCount(el, target);
            observer.unobserve(el);
        });
    }, { threshold: 0.5 });

    nums.forEach(n => observer.observe(n));
}

function animateCount(el, target) {
    const duration = 1800;
    const start = performance.now();

    function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(ease * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(step);
}

/* ─────────────────────────────────────────────────────
   5. Scroll Reveal
───────────────────────────────────────────────────── */
function initScrollReveal() {
    const elements = document.querySelectorAll(
        '.feature-card, .announcement-card, .status-card, .cmd-table tr'
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${(i % 6) * 60}ms`;
                entry.target.classList.add('reveal', 'visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });

    elements.forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

/* ─────────────────────────────────────────────────────
   6. Software Status Cards — fetch from WEAO API
   Falls back to curated static data if API is unavailable
───────────────────────────────────────────────────── */

// Static fallback data matching real WEAO exploits
const FALLBACK_STATUSES = [
    { name: 'Synapse Z',      category: 'Executor',   status: 'online'  },
    { name: 'Velocity',       category: 'Executor',   status: 'online'  },
    { name: 'Awaken',         category: 'Executor',   status: 'online'  },
    { name: 'Solara',         category: 'Executor',   status: 'partial' },
    { name: 'Fluxus',         category: 'Executor',   status: 'online'  },
    { name: 'Codex',          category: 'Executor',   status: 'offline' },
    { name: 'Electron',       category: 'Executor',   status: 'online'  },
    { name: 'Evon',           category: 'Executor',   status: 'partial' },
    { name: 'Seliware',       category: 'Executor',   status: 'online'  },
    { name: 'KRNL',           category: 'Executor',   status: 'offline' },
    { name: 'Arceus X',       category: 'Mobile',     status: 'partial' },
    { name: 'Delta (iOS)',    category: 'Mobile',     status: 'online'  },
    { name: 'Cryptic',        category: 'Executor',   status: 'online'  },
    { name: 'Nezur',          category: 'Executor',   status: 'unknown' },
    { name: 'Trigon',         category: 'Executor',   status: 'online'  },
    { name: 'Cetus Hub',      category: 'Script Hub', status: 'online'  },
    { name: 'Hydrogen',       category: 'Mobile',     status: 'partial' },
    { name: 'Wave',           category: 'Executor',   status: 'online'  },
    { name: 'Delta (Android)','category': 'Mobile',   status: 'online'  },
    { name: 'Zorara',         category: 'Executor',   status: 'unknown' },
];

function statusSubText(status) {
    const map = {
        online:  'Fully operational',
        offline: 'Currently down',
        partial: 'Degraded / partial',
        unknown: 'Status unknown',
    };
    return map[status] || 'Status unknown';
}

function renderStatusCards(data) {
    const grid = document.getElementById('statusGrid');
    grid.innerHTML = '';

    data.forEach((item, i) => {
        const status = (item.status || 'unknown').toLowerCase();
        const card = document.createElement('div');
        card.className = 'status-card';
        card.style.animationDelay = `${i * 40}ms`;
        card.innerHTML = `
            <div class="status-dot ${status}"></div>
            <div class="status-info">
                <div class="si-name">${escHtml(item.name)}</div>
                <div class="si-sub">${escHtml(item.category || '')}</div>
            </div>
            <div class="status-badge badge-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</div>
        `;
        grid.appendChild(card);
    });
}

async function fetchStatuses() {
    const lastUpdated = document.getElementById('lastUpdated');
    const refreshBtn  = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.classList.add('spinning');

    // Try multiple WEAO API endpoints in sequence
    const WEAO_ENDPOINTS = [
        'https://api.weao.xyz/exploits',
        'https://whatexpsare.online/api/status/exploits',
        'https://whatexpsare.online/api/exploits',
    ];

    async function tryFetchWeao() {
        for (const url of WEAO_ENDPOINTS) {
            try {
                const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
                if (!res.ok) continue;
                const json = await res.json();
                const arr = Array.isArray(json) ? json : json.exploits || json.data || [];
                if (arr.length === 0) continue;
                return arr.map(e => ({
                    name:     e.name     || e.title || 'Unknown',
                    category: e.type     || e.category || 'Executor',
                    status:   (e.status  || e.state || 'unknown').toLowerCase()
                })).slice(0, 30);
            } catch (_) { /* try next */ }
        }
        return null;
    }

    try {
        const data = await tryFetchWeao();
        if (!data) throw new Error('All WEAO endpoints failed');

        renderStatusCards(data);
        if (lastUpdated) lastUpdated.textContent = new Date().toLocaleTimeString();
    } catch (err) {
        console.warn('WEAO API unavailable, using fallback data:', err.message);
        renderStatusCards(FALLBACK_STATUSES);
        if (lastUpdated) lastUpdated.textContent = new Date().toLocaleTimeString() + ' (cached)';
    } finally {
        if (refreshBtn) refreshBtn.classList.remove('spinning');
    }
}

function initStatusCards() {
    fetchStatuses();
    // Auto-refresh every 60 seconds
    setInterval(fetchStatuses, 60_000);
}

function initRefreshBtn() {
    const btn = document.getElementById('refreshBtn');
    if (!btn) return;
    btn.addEventListener('click', fetchStatuses);
}

/* ─────────────────────────────────────────────────────
   7. Commands Table
───────────────────────────────────────────────────── */
const COMMANDS = [
    { cmd: '/ban',          desc: 'Ban a member from the server with optional reason & duration.',  cat: 'mod'     },
    { cmd: '/kick',         desc: 'Kick a member out of the server.',                               cat: 'mod'     },
    { cmd: '/warn',         desc: 'Warn a member and log it in the server audit.',                  cat: 'mod'     },
    { cmd: '/mute',         desc: 'Timeout a member for a specified duration.',                     cat: 'mod'     },
    { cmd: '/purge',        desc: 'Bulk delete messages in a channel (up to 100).',                 cat: 'mod'     },
    { cmd: '/slowmode',     desc: 'Set channel slowmode interval.',                                 cat: 'mod'     },
    { cmd: '/8ball',        desc: 'Ask the magic 8-ball a yes/no question.',                        cat: 'fun'     },
    { cmd: '/trivia',       desc: 'Start a trivia game in the channel.',                            cat: 'fun'     },
    { cmd: '/coinflip',     desc: 'Flip a coin — heads or tails?',                                  cat: 'fun'     },
    { cmd: '/rps',          desc: 'Play rock-paper-scissors against the bot.',                      cat: 'fun'     },
    { cmd: '/truth',        desc: 'Get a random truth or dare prompt.',                             cat: 'fun'     },
    { cmd: '/meme',         desc: 'Fetch a random meme from Reddit.',                               cat: 'fun'     },
    { cmd: '/status',       desc: 'Check the live status of a Roblox exploit or tool.',             cat: 'roblox'  },
    { cmd: '/statusall',    desc: 'Show all tracked exploit statuses in an embed.',                 cat: 'roblox'  },
    { cmd: '/setalerts',    desc: 'Set a channel to receive exploit status change pings.',          cat: 'roblox'  },
    { cmd: '/rouser',       desc: 'Look up a Roblox user profile by username or ID.',              cat: 'roblox'  },
    { cmd: '/play',         desc: 'Play a song from YouTube, Spotify, or SoundCloud by name/URL.', cat: 'music'   },
    { cmd: '/skip',         desc: 'Skip the currently playing track.',                              cat: 'music'   },
    { cmd: '/queue',        desc: 'View the current music queue.',                                  cat: 'music'   },
    { cmd: '/volume',       desc: 'Adjust the music playback volume (0–200).',                     cat: 'music'   },
    { cmd: '/lyrics',       desc: 'Fetch lyrics for the currently playing song.',                  cat: 'music'   },
    { cmd: '/rank',         desc: 'View your XP rank card in this server.',                        cat: 'utility' },
    { cmd: '/leaderboard',  desc: 'Show the top XP earners in the server.',                        cat: 'utility' },
    { cmd: '/balance',      desc: 'Check your economy wallet and bank balance.',                   cat: 'utility' },
    { cmd: '/daily',        desc: 'Claim your daily coin reward.',                                  cat: 'utility' },
    { cmd: '/translate',    desc: 'Translate text to a target language.',                          cat: 'utility' },
    { cmd: '/poll',         desc: 'Create a quick poll with up to 10 options.',                    cat: 'utility' },
    { cmd: '/remind',       desc: 'Set a reminder (e.g. /remind 30m take a break).',               cat: 'utility' },
    { cmd: '/ticket',       desc: 'Open a new support ticket.',                                     cat: 'utility' },
    { cmd: '/giveaway',     desc: 'Start a timed giveaway with role requirements.',                cat: 'utility' },
];

function initCommandsTable() {
    const tbody = document.getElementById('cmdTableBody');
    if (!tbody) return;
    renderCommandRows(COMMANDS);
}

function renderCommandRows(list) {
    const tbody = document.getElementById('cmdTableBody');
    tbody.innerHTML = list.map(c => `
        <tr data-cat="${c.cat}">
            <td>${escHtml(c.cmd)}</td>
            <td>${escHtml(c.desc)}</td>
            <td><span class="cmd-tag tag-${c.cat}">${c.cat}</span></td>
        </tr>
    `).join('');
}

function initCmdFilter() {
    const filters = document.querySelectorAll('.cmd-filter');
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const cat = btn.getAttribute('data-cat');
            const filtered = cat === 'all' ? COMMANDS : COMMANDS.filter(c => c.cat === cat);
            renderCommandRows(filtered);
        });
    });
}

/* ─────────────────────────────────────────────────────
   8. Announcements — text-only, no images
───────────────────────────────────────────────────── */
const ANNOUNCEMENTS = [
    {
        type: 'update',
        typeLabel: '🚀 Major Update',
        title: 'v2.0 — Massive overhaul is live!',
        date: 'July 26, 2026',
        body: `ecco's girl v2.0 is now live! This is the biggest update we've ever shipped.`,
        bullets: [
            'Added AI Chat Companion module — mention the bot to start a conversation',
            'Completely rebuilt music engine with Spotify & SoundCloud support',
            'New Verification Gate system with CAPTCHA and phone verify',
            'Per-server slash command creator added',
            'Translator module now supports 50+ languages',
        ]
    },
    {
        type: 'feature',
        typeLabel: '✨ New Feature',
        title: 'Roblox Exploit Status Tracker is now in the bot',
        date: 'July 20, 2026',
        body: `You can now use /status [name] and /statusall inside Discord to get live exploit tracking. Set up a dedicated alert channel with /setalerts so your server gets pinged the moment a tool changes status. Data is powered by the WEAO API.`,
        bullets: []
    },
    {
        type: 'fix',
        typeLabel: '🔧 Bug Fix',
        title: 'Music queue and skip bugs resolved',
        date: 'July 15, 2026',
        body: 'Several reported issues have been patched:',
        bullets: [
            'Fixed: /skip would sometimes skip 2 songs in the queue',
            'Fixed: /queue not updating after songs finished',
            'Fixed: Volume not persisting between sessions',
            'Fixed: Rare crash when adding Spotify playlists >200 songs',
        ]
    },
    {
        type: 'maint',
        typeLabel: '🔩 Maintenance',
        title: 'Scheduled downtime — July 12 at 3 AM UTC',
        date: 'July 11, 2026',
        body: `We will be performing database migrations and infrastructure upgrades. Expected downtime is 15–30 minutes. The bot will automatically reconnect to all servers once maintenance is complete. No data will be lost.`,
        bullets: []
    },
    {
        type: 'feature',
        typeLabel: '✨ New Feature',
        title: 'Giveaway system & Ticket system both launched',
        date: 'July 5, 2026',
        body: 'Two long-requested features are now live:',
        bullets: [
            'Giveaway: set duration, winners count, and role requirements',
            'Giveaway: reroll support via /greroll',
            'Tickets: category-based routing to staff roles',
            'Tickets: auto-transcript saved to a log channel on close',
        ]
    },
    {
        type: 'update',
        typeLabel: '📢 Announcement',
        title: 'ecco\'s girl hits 4,000 servers!',
        date: 'July 1, 2026',
        body: `We just crossed 4,000 servers — thank you all so much! To celebrate, we are permanently unlocking the Economy module for all servers. No more premium gate — it is free for everyone forever. Thank you for your continued support. 💕`,
        bullets: []
    },
];

function initAnnouncementsList() {
    const list = document.getElementById('announcementsList');
    if (!list) return;

    list.innerHTML = ANNOUNCEMENTS.map(ann => {
        const bullets = ann.bullets.length
            ? `<ul>${ann.bullets.map(b => `<li>${escHtml(b)}</li>`).join('')}</ul>`
            : '';
        return `
            <div class="announcement-card ann-${ann.type} reveal">
                <div class="ann-header">
                    <span class="ann-type-tag">${ann.typeLabel}</span>
                    <span class="ann-title">${escHtml(ann.title)}</span>
                    <span class="ann-date">${escHtml(ann.date)}</span>
                </div>
                <div class="ann-body">
                    ${escHtml(ann.body)}
                    ${bullets}
                </div>
            </div>
        `;
    }).join('');

    // Trigger reveal for newly inserted cards
    requestAnimationFrame(() => {
        list.querySelectorAll('.reveal').forEach((el, i) => {
            setTimeout(() => el.classList.add('visible'), i * 80);
        });
    });
}

/* ─────────────────────────────────────────────────────
   Utility
───────────────────────────────────────────────────── */
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
