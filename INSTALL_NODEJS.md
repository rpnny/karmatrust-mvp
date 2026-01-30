# Node.js Installation Guide for macOS

## 🎯 Quick Start (Recommended)

### Method 1: Official Installer (Easiest)

**Perfect for: First-time Node.js users**

1. **Visit the official website:**
   ```
   https://nodejs.org/
   ```

2. **Download the installer:**
   - Click the big green button: **"20.x LTS (Recommended For Most Users)"**
   - This will download: `node-v20.x.x.pkg`

3. **Install:**
   - Double-click the downloaded `.pkg` file
   - Click "Continue" through all steps
   - Enter your macOS password when prompted
   - Click "Install"

4. **Verify installation:**
   ```bash
   # Open a NEW terminal window (important!)
   node --version
   # Should show: v20.x.x
   
   npm --version
   # Should show: 10.x.x
   ```

5. **✅ Success! Continue to testing:**
   ```bash
   cd "/Users/ronny/Desktop/hackerthon ethglobal/karmatrust-mvp"
   ./verify-project.sh
   cd backend && npm install && npm run dev
   ```

---

## Method 2: Homebrew (For Developers)

**Perfect for: Developers who want easy updates and package management**

### Step 1: Install Homebrew

```bash
# Open Terminal and run:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Enter your password when prompted
# Wait ~5 minutes for installation
```

### Step 2: Add Homebrew to PATH

After installation, Homebrew will show you commands like:

```bash
# Add to your shell profile (~/.zprofile or ~/.bash_profile)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### Step 3: Install Node.js

```bash
# Install Node.js
brew install node

# Verify
node --version  # v20.x.x
npm --version   # 10.x.x
```

---

## Method 3: NVM (For Advanced Users)

**Perfect for: Managing multiple Node.js versions**

### Install NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then:
nvm install 20
nvm use 20
nvm alias default 20
```

---

## Verification Checklist

After installation, verify everything works:

```bash
# 1. Check Node.js version
node --version
# ✓ Should show v20.x.x (or newer)

# 2. Check npm version
npm --version
# ✓ Should show v10.x.x (or newer)

# 3. Test node command
node -e "console.log('Node.js works!')"
# ✓ Should print: Node.js works!

# 4. Test npm command
npm --version
# ✓ Should show version number
```

---

## Troubleshooting

### Issue 1: "command not found: node"

**Solution:** Restart your terminal completely (quit and reopen)

```bash
# If still doesn't work, check installation path:
which node
# Should show: /usr/local/bin/node or /opt/homebrew/bin/node
```

---

### Issue 2: Permission errors with npm

**Solution:** Fix npm permissions

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zprofile
source ~/.zprofile
```

---

### Issue 3: Old version installed

**Solution:** Update to latest LTS

```bash
# If using Homebrew:
brew update
brew upgrade node

# If using official installer:
# Download and install the latest .pkg from nodejs.org
```

---

## Next Steps After Installation

### 1. Navigate to project

```bash
cd "/Users/ronny/Desktop/hackerthon ethglobal/karmatrust-mvp"
```

### 2. Verify project structure

```bash
./verify-project.sh
# Should show: ✅ Passed: 47
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

**Expected output:**
```
added 150+ packages in 30s
```

### 4. Start backend server

```bash
npm run dev
```

**Expected output:**
```
═══════════════════════════════════════════════════════════
  🏆 KarmaTrust API Server
═══════════════════════════════════════════════════════════
  ✓ Server running on port 3000
  ✓ Environment: development
```

### 5. Test API (in new terminal)

```bash
curl http://localhost:3000/api/health
```

**Expected:**
```json
{"status":"ok","timestamp":1706500000000}
```

### 6. Install frontend dependencies

```bash
# Open NEW terminal
cd "/Users/ronny/Desktop/hackerthon ethglobal/karmatrust-mvp/frontend"
npm install
```

### 7. Start frontend

```bash
npm run dev
```

**Expected:**
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:5173/
```

### 8. Open browser

Visit: **http://localhost:5173**

Click "Vitalik" → See credit score dashboard!

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `node --version` | Check Node.js version |
| `npm --version` | Check npm version |
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |

---

## Recommended Setup for Hackathon

### Install these global tools:

```bash
# TypeScript (for type checking)
npm install -g typescript

# TSX (for running TypeScript directly)
npm install -g tsx

# Prettier (for code formatting)
npm install -g prettier

# ESLint (for code linting)
npm install -g eslint
```

---

## Need Help?

If you encounter issues:

1. **Check the official docs:**
   - Node.js: https://nodejs.org/docs
   - npm: https://docs.npmjs.com/

2. **Common fixes:**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check system requirements:**
   - macOS 10.15 or later
   - 200 MB free disk space
   - Internet connection for downloads

---

## ✅ Installation Complete!

Once Node.js is installed and `node --version` shows v20+, you're ready to:

1. ✅ Run `./verify-project.sh`
2. ✅ Start backend: `cd backend && npm run dev`
3. ✅ Start frontend: `cd frontend && npm run dev`
4. ✅ Follow `TESTING.md` for full test suite
5. ✅ Win the hackathon! 🏆

---

**Last Updated:** January 2026
