# 🐦 Pidgey Hunt — Rock Toss Trainer

A Duck Hunt-inspired browser game where cute bird creatures fly across the sky and you throw rocks to hit them. Built with **Phaser 3** as a **Progressive Web App** — runs on any device, no installation required.

![Game Preview](icons/icon-192.png)

## 🎮 Play Now

After deploying (see below), your game will be live at:
```
https://<your-username>.github.io/<repo-name>/
```

## 🕹️ How to Play

- **Click or tap** anywhere on the screen to throw a rock at that spot
- Hit birds to earn points
- Build combos by hitting consecutive birds without missing
- Game lasts **60 seconds** — go for the highest score!

### Bird Types

| Bird | Points | Speed | Notes |
|------|--------|-------|-------|
| 🐦 Normal | 10 | Medium | Most common |
| ⚡ Fast | 20 | Very fast | Harder to hit |
| ✨ Golden | 50 | Medium-fast | Rare, valuable! |

### Combo System

| Combo | Multiplier |
|-------|-----------|
| 1–2 hits | ×1 |
| 3–5 hits | ×2 |
| 6–9 hits | ×3 |
| 10+ hits | ×4 |

## 🚀 Deployment to GitHub Pages

### Quickstart (1 minute)

1. **Fork or create a new repo** on GitHub
2. **Upload all files** from this project to the repo root
3. Go to **Settings → Pages**
4. Set Source to **GitHub Actions**
5. Push to `main` — the workflow auto-deploys!

### Detailed Steps

```bash
# 1. Clone your new empty repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# 2. Copy all game files here
cp -r /path/to/pidgey-hunt/* .

# 3. Commit and push
git add .
git commit -m "Initial game deployment"
git push origin main
```

Then in GitHub:
- Go to **Settings → Pages → Source → GitHub Actions**
- The included `.github/workflows/deploy.yml` handles the rest

### Enable GitHub Pages

1. In your repo, click **Settings**
2. Scroll to **Pages** in the left sidebar
3. Under **Source**, select **GitHub Actions**
4. The next push to `main` will trigger deployment

## 🛠️ Local Development

No build tools required! Just serve the files with any static server:

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code: use the "Live Server" extension
```

Then open `http://localhost:8080` in your browser.

> **Note:** ES Modules require a proper HTTP server — opening `index.html` directly via `file://` will not work.

## 📁 Project Structure

```
pidgey-hunt/
├── index.html              # Entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (offline support)
├── generate_icons.py       # Icon generator script
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── main.js             # Phaser game config & initialization
│   ├── scenes/
│   │   ├── BootScene.js    # Initial setup
│   │   ├── PreloadScene.js # Procedural asset generation
│   │   ├── MenuScene.js    # Main menu
│   │   ├── GameScene.js    # Core gameplay
│   │   ├── UIScene.js      # HUD overlay
│   │   ├── GameOverScene.js
│   │   ├── HighScoreScene.js
│   │   └── SettingsScene.js
│   └── utils/
│       ├── AudioManager.js # Web Audio API sounds
│       ├── BirdFactory.js  # Bird spawning & animation
│       └── ScoreManager.js # Score & combo logic
└── .github/
    └── workflows/
        └── deploy.yml      # Auto-deploy to GitHub Pages
```

## 🎵 Audio

All sounds are generated procedurally via the **Web Audio API** — no audio files needed! This ensures the game works offline and loads instantly.

- **Throw sound**: Sawtooth wave sweep
- **Hit sound**: Noise burst + frequency filter
- **Golden hit**: Extra ping chime
- **Miss sound**: Triangle wave descend
- **Background music**: Chiptune melody loop

Toggle music with the 🎵 button in-game or press **M**.

## 📱 Mobile / PWA Features

- **Installable** on Android and iOS (Add to Home Screen)
- **Fullscreen** on mobile devices
- **Touch controls** — tap anywhere to throw
- **Haptic feedback** on hit (where supported)
- **Offline play** via Service Worker cache

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `M` | Toggle music |
| `ESC` | End game / back |

## 🔧 Configuration

Edit `src/main.js` to adjust:
- Game canvas dimensions (`BASE_WIDTH`, `BASE_HEIGHT`)
- Game duration (in `GameScene.js` → `this._gameDuration`)

Edit `src/utils/BirdFactory.js` to adjust:
- Bird speeds, point values, spawn weights
- Difficulty scaling

## 📜 License

MIT — free to use, modify, and distribute.

---

Made with ❤️ using [Phaser 3](https://phaser.io/)
