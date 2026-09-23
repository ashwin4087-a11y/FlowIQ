# 🚀 FlowIQ Localhost Setup Guide

## ⚡ Quick Start (60 seconds)

```bash
# Navigate to FlowIQ directory
cd c:\Users\USER\Downloads\FlowIQ

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

**That's it!** 🎉 Your app will be live at: `http://localhost:5173`

---

## 🔧 Full Setup Steps

### Step 1: Prerequisites
```bash
# Check if you have Node.js installed
node --version        # Should be v18+ 
npm --version         # Node package manager

# Check if you have pnpm installed
pnpm --version        # If not, install: npm install -g pnpm
```

### Step 2: Navigate to Project
```bash
cd c:\Users\USER\Downloads\FlowIQ
```

### Step 3: Install Dependencies
```bash
pnpm install
# This installs all packages from package.json (~2-3 min first time)
```

### Step 4: Start Dev Server
```bash
pnpm dev
```

**Output should show:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

### Step 5: Open in Browser
```
Visit: http://localhost:5173
```

---

## 🗺️ Navigate to Routes Demo

Once localhost is running:

**Option A: Enhanced Routes HTML**
```
http://localhost:5173/flowiq-enhanced-routes.html
```

**Option B: React App (if integrated)**
```
http://localhost:5173/
```

---

## 📁 Project Structure

```
FlowIQ/
├── 📄 package.json           ← Dependencies config
├── 📄 vite.config.ts         ← Vite settings
├── 📄 index.html             ← Main entry point
├── 📁 src/
│   ├── main.tsx              ← React entry
│   ├── app/
│   │   ├── App.tsx           ← Main component
│   │   └── components/
│   │       ├── VehicleDetection.tsx      (✅ Fixed)
│   │       ├── AdvancedRouteSelector.tsx (🆕 New routes UI)
│   │       ├── LiveCameraFeed.tsx        (✅ Working)
│   │       └── HardwareMonitor.tsx       (✅ Working)
│   └── hooks/
│       └── useAdvancedRouting.ts         (🆕 New routes hook)
├── 🗺️ flowiq-enhanced-routes.html      (🆕 Standalone map)
└── 📖 ADVANCEMENT_GUIDE.md, QUICK_START.md
```

---

## 🎯 What Runs on Localhost

### Components Available:
✅ **VehicleDetection** - YOLO dataset visualization  
✅ **LiveCameraFeed** - Real-time vehicle animation  
✅ **HardwareMonitor** - ESP32 & sensor dashboard  
✅ **AdvancedRouteSelector** - 8-zone route optimizer  

### Static Files:
✅ **flowiq-enhanced-routes.html** - Standalone map  
✅ **public/data/** - Vehicle detection datasets  
✅ **styles/** - Tailwind CSS + custom themes  

---

## 🔥 Hot Module Replacement (HMR)

Vite enables **instant code updates**:
1. Edit any file
2. Save (Ctrl+S / Cmd+S)
3. **Auto-refreshes** in browser instantly ⚡

Example:
```typescript
// Edit. src/app/components/AdvancedRouteSelector.tsx
// Save
// Browser auto-refreshes with your changes!
```

---

## 📊 Port Already in Use?

If `localhost:5173` is taken:

```bash
# Option 1: Kill process using that port (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Option 2: Use different port
vite --port 3000
# Then visit: http://localhost:3000
```

---

## 🛠️ Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| `pnpm: command not found` | Install pnpm: `npm install -g pnpm` |
| `Port 5173 already in use` | Change port: `vite --port 3000` |
| Modules not found errors | Run: `pnpm install` again |
| Styles not loading | Clear cache: `rm -rf .vite` (Mac/Linux) or `rmdir .vite` (Windows) |
| Map not showing | Check internet (Leaflet needs tiles), clear cache |

---

## 🌐 Access from Other Devices

### Local Network Access:
```bash
# Get your local IP
ipconfig getifaddr en0          # Mac
ipconfig                        # Windows - look for IPv4

# Access from other device:
http://<YOUR_IP>:5173
```

Example:
```
Your PC: 192.168.1.100
Phone on same WiFi: http://192.168.1.100:5173
```

---

## 🔐 Localhost Features

✅ **Auto-refresh** on code changes  
✅ **Source maps** for debugging  
✅ **Fast rebuild** (~100ms)  
✅ **HMR** enabled by default  
✅ **CORS** automatically configured  
✅ **Dev server logs** in terminal  

---

## 📈 Optimize Localhost

### For Better Performance:

```bash
# Option 1: Build for optimization
pnpm build
# Then preview: pnpm preview

# Option 2: Analyze bundle
vite build --report
```

---

## 🐛 Debug Mode

### Browser DevTools:
```
Press: F12 or Right-click → Inspect
```

### Check Vite Logs:
```
Terminal showing: 
[vite] hmr update received: ...
[vite] full reload ...
```

### React DevTools:
```
Install: React Developer Tools extension
Then: Browse → Create element
```

---

## 🚀 Build for Production

When ready to deploy:

```bash
# Production build (optimized)
pnpm build

# Output in: dist/
# Ready to deploy to any static host!

# Test production build locally:
pnpm preview
# Visit: http://localhost:4173
```

---

## 📱 Mobile Testing

### Test on Your Phone:

```bash
# 1. Start dev server
pnpm dev

# 2. Get local IP
# Windows: ipconfig → IPv4 Address
# Mac: ipconfig getifaddr en0

# 3. Visit from phone on same WiFi:
http://192.168.X.X:5173
```

---

## 🔄 Stop & Restart

```bash
# Stop server
Press: Ctrl+C in terminal

# Restart
pnpm dev
```

---

## 📋 Checklist Before Starting

- ✅ Node.js v18+ installed
- ✅ pnpm installed (`npm install -g pnpm`)
- ✅ In correct directory (`c:\Users\USER\Downloads\FlowIQ`)
- ✅ `pnpm install` completed
- ✅ Port 5173 available
- ✅ Internet connection (for map tiles)

---

## 🎓 Next: Integrate Components

Once localhost is running, integrate routes:

### Edit: `src/app/App.tsx`
```tsx
import { AdvancedRouteSelector } from './components/AdvancedRouteSelector';

export function App() {
  return (
    <div>
      <h1>FlowIQ Dashboard</h1>
      <AdvancedRouteSelector />  {/* ← Add this */}
    </div>
  );
}
```

Save → **Auto-refreshes** in browser! ⚡

---

## 📞 Troubleshooting

**"Lost connection to vite server"**
```
→ Server crashed. Terminal showing error?
→ Run: pnpm dev again
```

**"Cannot find module"**
```
→ Run: pnpm install
→ Some dependency might be missing
```

**"Compiled successfully but blank page"**
```
→ Check browser console (F12)
→ Look for red errors
→ Check src/main.tsx is correct
```

---

## 🎉 You're Ready!

```
Terminal:                Browser:
$ pnpm dev              http://localhost:5173 ✅
  ↓
[VITE] ready
  ↓
Edit code              Auto-refresh → Live updates ⚡
```

**Happy coding! 🚀**

---

**Version**: 2.1.0  
**Setup Time**: ~5 minutes  
**Status**: Production Ready ✅
