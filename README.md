<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=speech&height=200&color=gradient&text=ADEMOLA%20XD&animation=blinking&fontAlign=36&fontAlignY=36&descAlign=62&reversal=false&textBg=false" width="100%">
</div>

<h1 align="center">🤖 ADEMOLA XD — WhatsApp Bot</h1>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.2.0-00FF00?style=flat-square">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square">
  <img src="https://img.shields.io/badge/license-ISC-blue?style=flat-square">
  <img src="https://img.shields.io/github/forks/XdKing2/MALVIN-XD?style=flat-square&color=1E88E5">
  <img src="https://img.shields.io/github/stars/XdKing2/MALVIN-XD?style=flat-square&color=FFD700">
</p>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&duration=4000&color=00FF00&center=true&vCenter=true&width=600&lines=237+COMMANDS+%7C+24+CATEGORIES;AI+CHATBOT+%7C+DOWNLOADER+%7C+GROUP+MANAGER;STICKER+MAKER+%7C+TEXT+EFFECTS+%7C+AUDIO+EDITOR;AUTO-REPLY+%7C+ANTI-DELETE+%7C+ANTI-CALL;POWERED+BY+ADEMOLA+TECH" alt="typing animation">
</p>

---

## ✨ Features

| Category | Description |
|---|---|
| 🤖 **AI & Chat** | GPT, Gemini, Copilot, Venice AI, Sora, Creart, Document AI |
| 📥 **Downloader** | YouTube, Spotify, TikTok, Instagram, Facebook, Twitter, Mega, MediaFire, GDrive |
| 🎮 **Fun & Games** | TicTacToe, Truth/Dare, Memes, Quotes, Compliments, Insults, Anime GIFs |
| 💬 **Group Management** | Promote/Demote, Kick/Add, Mute/Unmute, Warn, TagAll, Anti-Link, Welcome/Goodbye |
| 🛠️ **Utilities** | Translate, Screenshot, URL Shortener, Web ZIP, GitHub/YT Stalker |
| 🎨 **Media & Stickers** | Sticker Maker, Emoji Mix, GIF Search, ViewOnce Reveal, Audio/Video Converter |
| 🔊 **Audio Editor** | Bass Boost, Nightcore, Robot, Slow/Fast, Reverse, and 16+ effects |
| 🖼️ **Image Effects** | Filters, Memes, Social Mockups, Profile Picture Effects |
| 📝 **Text Effects** | 19 text styles: Neon, Fire, Glitch, Matrix, Blackpink, and more |
| 🔒 **Security** | Anti-Call (auto-block), Anti-Delete, Anti-Link, Anti-Badword, PM Blocker |
| ⚙️ **Auto Features** | Auto-Reply (away mode), Auto-Read, Auto-Typing, Auto-Status, Auto-Reactions |
| 👑 **Owner Tools** | Sudo Users, Ban/Unban, Session Backup, Settings Manager, Bot Image/Audio |

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm

### Installation

```bash
git clone https://github.com/XdKing2/MALVIN-XD
cd ADEMOLA-XD
npm install --legacy-peer-deps
```

### Configuration

Copy `.env.example` to `.env` and edit:

```env
SESSION_ID=            # Leave empty for first-time pairing
OWNER_NUMBER=2348108574293
OWNER_NAME=Ademola
BOT_NAME=ademola-xd
MODE=public
TIMEZONE=Africa/Lagos
```

### Run

```bash
npm start                  # Standard mode
npm start:optimized        # Memory-limited (512MB)
npm start:fresh            # Reset session + start
npm run start:clean        # Clean temp + start
```

---

## 🔐 Authentication

### Method 1: Pairing Code (Recommended for first use)

1. Set `SESSION_ID=` (empty) in `.env`
2. Run `npm start`
3. Enter your WhatsApp number when prompted (e.g., `2348108574293`)
4. A **6-8 digit code** appears in terminal
5. Open WhatsApp → **Linked Devices** → **Link a Device**
6. Enter the pairing code
7. Session saved to `session/creds.json` — reused on restart

### Method 2: Session ID (For servers/redeploys)

After pairing, **base64-encode** `session/creds.json` and set:
```
SESSION_ID=ademola~<base64-data>
```

### Method 3: QR Code

Remove the phone number from `index.js` line 300, run the bot, and scan the QR code in terminal.

---

## 📖 Commands

All 237 commands organized into 24 categories. Send `.menu` in WhatsApp to browse interactively.

### Common commands

| Command | Description |
|---|---|
| `.menu` | Show interactive menu with categories |
| `.ping` | Check bot response speed |
| `.alive` | Show bot status and system info |
| `.owner` | Send owner contact card |
| `.repo` | Show GitHub repository |
| `.mode public/private` | Toggle bot access |
| `.prefix <symbol>` | Change command prefix |
| `.autoreply on/off/set` | Auto-reply when away |

---

## ☁️ Deployment

| Platform | Link |
|---|---|
| Heroku | [![Deploy](https://img.shields.io/badge/Heroku-430098?style=for-the-badge&logo=heroku)](https://dashboard.heroku.com/new-app?template=https://github.com/XdKing2/MALVIN-XD) |
| Koyeb | [![Deploy](https://img.shields.io/badge/Koyeb-FF009D?style=for-the-badge&logo=koyeb)](https://app.koyeb.com/services/deploy?type=git&repository=XdKing2/MALVIN-XD) |
| Railway | [![Deploy](https://img.shields.io/badge/Railway-FF8700?style=for-the-badge&logo=railway)](https://railway.app/new) |
| Render | [![Deploy](https://img.shields.io/badge/Render-000000?style=for-the-badge&logo=render)](https://dashboard.render.com/web/new) |
| Panel/ZIP | [Download](https://github.com/XdKing2/MALVIN-XD/archive/refs/heads/main.zip) |

---

## ⚠️ Disclaimer

- This bot is **not affiliated with WhatsApp Inc.**
- Misuse may lead to account bans. Use responsibly.
- Cloning, redistributing, or modifying without credit is prohibited.

---

## 👨‍💻 Credits

Built with ❤️ by **Ademola King**

- GitHub: [@XdKing2](https://github.com/XdKing2)
- YouTube: [AdemolaTech](https://youtube.com/@ademolatech2)

---

<p align="center">
  <img src="https://i.imgur.com/LyHic3i.gif" height="40" width="100%">
</p>

<p align="center">
  <a href="https://github.com/XdKing2/MALVIN-XD/stargazers">⭐ Star</a> • <a href="https://github.com/XdKing2/MALVIN-XD/fork">🍴 Fork</a> • <a href="https://github.com/XdKing2/MALVIN-XD/issues">🐛 Report Issue</a>
</p>
