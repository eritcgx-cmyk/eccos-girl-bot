# UptimeRobot Setup - Keep ecco's girl Alive 24/7

UptimeRobot is a FREE external uptime monitor that pings your bot's /health endpoint every 5 minutes.

## Step-by-Step Setup

1. Go to https://uptimerobot.com and create a free account
2. Click '+ Add New Monitor'
3. Set Monitor Type: HTTP(s)
4. Friendly Name: ecco's girl Bot
5. URL: https://eccos-girl-bot.onrender.com/health
6. Monitoring Interval: Every 5 minutes
7. Click 'Create Monitor'

## Why This Works

- Bot has a built-in self-ping every 10 minutes (index.js)
- Server has a secondary ping every 4 minutes (server.js)
- UptimeRobot pings from outside every 5 minutes
- Combined: something hits the server every 4-5 min, well under Render's 15-min sleep threshold
