# 💖 ecco's girl — Discord Bot

An all-in-one Discord Bot built with **Node.js (discord.js v14)** and **SQLite**. Designed for high performance, dynamic software status tracking via [whatexpsare.online](https://whatexpsare.online/), interactive support tickets, custom script loadstrings management, announcements, and welcome greetings.

---

## ✨ Features

- **⚡ Live Software & Executor Status Tracker**:
  - Pulls status data from `https://whatexpsare.online/` API.
  - Command `/status check` for real-time executor checks (Solara, Celery, Wave, Hydrogen, Macsploit, etc.).
  - Command `/status setup-channel` to create an auto-refreshing status embed channel (updates every 5 minutes).

- **📜 Script Loadstring Manager**:
  - `/loadstring send <name>`: Sends clean, copyable loadstrings formatted in Lua code blocks.
  - `/loadstring add <name> <code> [description]`: Save new loadstrings to SQLite database.
  - `/loadstring list`: Browse all saved loadstrings.
  - `/loadstring delete <name>`: Remove outdated loadstrings.

- **🎟️ Support Ticket System**:
  - `/ticket-setup`: Places a ticket button embed in your specified channel.
  - Interactive buttons for users to open private tickets, staff to claim tickets, and close ticket channels automatically.

- **📢 Announcements & Update Logs**:
  - `/announce`: Send rich announcement embeds with optional role pings.
  - `/changelog`: Publish version update logs with change breakdown.

- **🌸 Custom Welcome System**:
  - `/welcome-setup`: Welcome new members automatically with custom greeting embeds and live member count badges.

- **🌐 24/7 Cloud Ready**:
  - Embedded Express web server on port `8080` for healthchecks and keep-alive.
  - Dockerized and pre-configured for **Koyeb** and **Render** free tier hosting.

---

## 🛠️ Step 1: Discord Developer Portal Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and name it **ecco's girl**.
3. Under **Bot**:
   - Click **Reset Token** and copy your **Bot Token** (Keep this private!).
   - Scroll down to **Privileged Gateway Intents** and enable:
     - ✅ **Server Members Intent**
     - ✅ **Message Content Intent**
4. Under **OAuth2 -> General**:
   - Copy your **APPLICATION ID** (This is your `CLIENT_ID`).
5. Under **OAuth2 -> URL Generator**:
   - Select scopes: `bot`, `applications.commands`.
   - Select permissions: `Administrator` (or `Manage Channels`, `Manage Messages`, `Send Messages`, `Embed Links`).
   - Copy the generated URL and use it to invite **ecco's girl** to your Discord server.

---

## 🚀 Step 2: Environment Setup & Local Testing

1. Open a terminal in the bot directory:
   ```bash
   cd C:\Users\godej\.gemini\antigravity-ide\scratch\eccos-girl-bot
   ```
2. Create your `.env` file from the template:
   - Copy `.env.example` to `.env`
   - Fill in your `DISCORD_TOKEN` and `CLIENT_ID`:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   PORT=8080
   STATUS_API_URL=https://whatexpsare.online/api/status
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Deploy slash commands to Discord:
   ```bash
   npm run deploy-commands
   ```
5. Start the bot locally:
   ```bash
   npm start
   ```

---

## ☁️ Step 3: Free 24/7 Hosting Setup

### Option A: Hosting on Koyeb (Recommended)

1. Push your bot repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial ecco's girl bot code"
   git remote add origin https://github.com/YOUR_USERNAME/eccos-girl-bot.git
   git push -u origin main
   ```
2. Log in to [Koyeb.com](https://www.koyeb.com/) (Free account).
3. Click **Create Service** -> **GitHub**.
4. Select your `eccos-girl-bot` repository.
5. Set Builder to **Dockerfile** (or Node.js).
6. Under **Environment Variables**, add:
   - `DISCORD_TOKEN`: `(Your Discord Bot Token)`
   - `CLIENT_ID`: `(Your Discord Client ID)`
   - `PORT`: `8080`
7. Click **Deploy**! Koyeb will keep your bot running 24/7 for FREE.

---

### Option B: Hosting on Render

1. Log in to [Render.com](https://render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**:
   - Add `DISCORD_TOKEN` and `CLIENT_ID`.
6. Click **Create Web Service**.

---

## 📖 Command Reference

| Command | Permission | Description |
| :--- | :--- | :--- |
| `/status check` | Everyone | View real-time software/executor statuses from whatexpsare.online |
| `/status setup-channel #channel` | Admin | Set up an auto-updating status embed channel (Refreshes every 5 mins) |
| `/loadstring send <name>` | Everyone | Display formatted Lua script loadstring |
| `/loadstring add <name> <code>` | Staff | Save a new loadstring script to SQLite |
| `/loadstring list` | Everyone | List all saved loadstrings |
| `/ticket-setup #channel #category` | Admin | Deploy support ticket creation panel |
| `/announce #channel <title> <content>` | Staff | Send official announcement embed |
| `/changelog #channel <version> <changes>`| Staff | Post software update log embed |
| `/welcome-setup #channel [message]` | Admin | Configure server join greeting embeds |

---

## 🛡️ License

Created for **ecco's girl** community under the MIT License.
