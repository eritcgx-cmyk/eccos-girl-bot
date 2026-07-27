# 🤖 Handoff Prompt for Assistant / AI on Other PC

> **Copy and paste the prompt block below to any AI assistant on your other PC to immediately get it 100% caught up to speed on this codebase, data sources, and deployment!**

---

```markdown
You are assisting with the "ecco's girl" Discord bot and Web Application project.

### 📌 Project Overview & Architecture
- **Bot Name**: `ecco's girl` (Tag: `ecco's girl#8655`, Client ID: `1531068742631555337`)
- **Primary Server Lock**: Guild ID `1468916727940382786` (Invite: `https://discord.gg/9GRTstjc6b`). The bot auto-leaves any unauthorized guild.
- **Super Admin / Bot Owner**: Discord User ID `1105560420393156619` (Permanently whitelisted in `src/whitelist.js`).
- **Live 24/7 Cloud Host**: Render.com (`https://eccos-girl-bot.onrender.com`)
- **GitHub Repository**: `https://github.com/eritcgx-cmyk/eccos-girl-bot.git` (Branches: `main` & `master`)

### 🌐 Data Sources & Integrated Services
1. **Live Executor Status API (WEAO Data Sources)**:
   - Primary: `https://whatexpsare.online/api/status/exploits`
   - Secondary / Fallbacks: `https://api.weao.xyz/exploits` & `https://whatexpsare.online/api/exploits`
   - Data fetched: Live status (`updateStatus`), detection state (`detected`), version (`version`), and notes for tracked executors (**Volt**, **Synapse Z**, **Wave**, **Delta**, **Cosmic**, **Potassium**).
2. **Discord Developer Portal**:
   - URL: `https://discord.com/developers/applications/1531068742631555337/oauth2`
   - Configured Redirect URIs:
     - `https://eccos-girl-bot.onrender.com/auth/discord/callback`
     - `http://localhost:3000/auth/discord/callback`
3. **Render Cloud Platform Dashboard**:
   - Service URL: `https://dashboard.render.com/web/srv-d9j9kh3tqb8s73a0jt9g`
   - Deploys both Express web server & Discord bot in 1 process (`node index.js`) 24/7.

### ⚡ Key Features & Engine Implementation
1. **Discord OAuth2 Whitelist Gate**:
   - Site landing page forces Discord OAuth login (`public/login.html`).
   - Non-whitelisted accounts receive `public/access-denied.html` showing their Discord avatar and ID.
   - Whitelisted users are granted access to the site and dedicated Control Dashboard (`/dashboard`).
2. **Dynamic Status Channels**:
   - Channel Name Format: `╠➣〢{emoji}〢{SerifName}-𝐒𝐭𝐚𝐭𝐮𝐬` (e.g. `╠➣〢🟢〢𝐕𝐨𝐥𝐭-𝐒𝐭𝐚𝐭𝐮𝐬`, `╠➣〢🔵〢𝐏𝐨𝐭𝐚𝐬𝐬𝐢𝐮𝐦-𝐒𝐭𝐚𝐭𝐮𝐬`, `╠➣〢🔴〢𝐂𝐨𝐬𝐦𝐢𝐜-𝐒𝐭𝐚𝐭𝐮𝐬`).
   - Supports 5 distinct states: `🟢` Undetected, `🔵` Bypassing, `🌕` Detected, `🟣` Updating, `🔴` Down / Patched.
   - Automatically broadcasts Software Changelog & Update Embeds into status channels when statuses change or when manually updated.
3. **Control Dashboard (`/dashboard`)**:
   - **Bot System Monitor**: Real-time memory usage, active server count, and bot connection status.
   - **Executor Status Control Panel**: Manually override executor statuses (`🟢`, `🔵`, `🌕`, `🟣`, `🔴`, `🔄`) and custom notes directly from web (persists in `data/db.json`).
   - **Whitelist Manager**: Live add/remove whitelisted Discord User IDs.
   - **Broadcast Announcement Builder**: Send embeds directly into Discord server channels from the web interface.
   - **Emoji Rule Manager**: Customize status emojis per server.
4. **Command Pack (50+ Commands)**:
   - Moderation: `/ban`, `/unban`, `/kick`, `/purge`, `/warn`, `/warnings`, `/clearwarnings`, `/timeout`, `/untimeout`, `/lock`, `/unlock`, `/slowmode`, `/role-add`, `/role-remove`.
   - Status & Channels: `/status`, `/statusall`, `/status-set`, `/status-channel add`, `/status-channel remove`, `/status-channel list`, `/status-channel emojis`, `/setalerts`.
   - Utility & Fun: `/announce`, `/ticket-setup`, `/welcome-setup`, `/loadstring`, `/changelog`, `/poll`, `/rps`, `/truth`, `/dare`, `/meme`, `/translate`, `/remind`, `/giveaway`, `/greroll`, `/rank`, `/leaderboard`, `/balance`, `/ping`, `/userinfo`, `/serverinfo`, `/avatar`, `/botstats`.
   - **Embed User Avatars**: All command embeds feature `setAuthor` and `setFooter` set to the PFP avatar of the user executing the command.

### 🛠️ Environment & Setup Instructions
1. Extract `eccos-girl-bot.zip` (includes pre-installed `node_modules`).
2. Deploy commands: `node src/deploy-commands.js`
3. Start server & bot locally: `node index.js`
4. Cloud auto-deployment: Any push to `main` branch automatically builds and deploys to Render.com.

Please acknowledge these details and confirm readiness to work on `eccos-girl-bot`!
```
