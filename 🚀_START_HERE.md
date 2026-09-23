# 🚀 FlowIQ - Get Working Localhost Now

## ⚡ Windows Users (Easiest)

### **Double-Click This File:**
```
START-LOCALHOST.bat
```

That's it! 🎉

**What happens:**
1. Installs dependencies (first time only)
2. Starts dev server
3. Shows: `http://localhost:5173`
4. Opens automatically in browser

---

## 🐧 Mac/Linux Users

### **Run This Command:**
```bash
cd c:\Users\USER\Downloads\FlowIQ
bash start-localhost.sh
```

Or manually:
```bash
cd c:\Users\USER\Downloads\FlowIQ
pnpm dev
```

---

## 📋 What You'll See

Once running:

```
================================================
  FlowIQ is LIVE!
================================================

  Main App:  http://localhost:5173
  Routes:    http://localhost:5173/flowiq-enhanced-routes.html
  Diagnostic: http://localhost:5173/DIAGNOSTIC.html

  Press Ctrl+C to stop
================================================
```

---

## 🌐 URLs to Visit

| URL | What You See |
|-----|-------------|
| `http://localhost:5173` | Main FlowIQ Dashboard |
| `http://localhost:5173/flowiq-enhanced-routes.html` | Interactive Route Selector |
| `http://localhost:5173/DIAGNOSTIC.html` | System Check Page |

---

## ✅ What Should Display

**Main App Should Show:**
- Dark navy background (#0F172A)
- FlowIQ logo top-left
- Dashboard/Mobile buttons
- Sidebar menu
- Traffic data visualization

**Route Map Should Show:**
- 8 zone tabs (Ashok Nagar, Guindy, etc.)
- Search inputs (From/To)
- Interactive Leaflet map
- 4 color-coded routes

---

## 🔧 If It Doesn't Work

### **Option 1: Manual Reset**
```bash
cd c:\Users\USER\Downloads\FlowIQ
Ctrl+C (if running)
rm -rf .vite node_modules
pnpm install
pnpm dev
```

### **Option 2: Check Port**
If port 5173 is busy:
```bash
pnpm dev --port 3000
# Then visit: http://localhost:3000
```

### **Option 3: Clear Cache**
```
Browser: Ctrl+Shift+Delete
Select All → Clear
Then: Ctrl+Shift+R (hard refresh)
```

---

## 🚨 Blank White Screen?

1. Press **F12** to open console
2. Look for **RED ERRORS**
3. Run the reset option above
4. Hard refresh: **Ctrl+Shift+R**

---

## ⏹️ Stop Server

Press: **Ctrl+C** in terminal

---

## 🎯 Next Steps

Once localhost is running:

✅ **Explore Dashboard**
- Click different tabs (Overview, Signals, etc.)
- View junction data
- Check signal timings

✅ **Try Route Selector**
- Go to routes page
- Select different zones
- Generate alternate routes

✅ **Test Mobile App**
- Click "Mobile App" button
- View mobile interface
- Try emergency features

---

## 📱 Access from Phone

Connect both devices to **same WiFi**, then:

1. Get your PC IP:
```bash
ipconfig | findstr "IPv4"
```

2. On phone browser, visit:
```
http://YOUR_PC_IP:5173
```

Example:
```
http://192.168.1.100:5173
```

---

## 🎉 You're All Set!

Just run one of these:

**Windows:** 
```
Double-click: START-LOCALHOST.bat
```

**Mac/Linux:**
```bash
bash start-localhost.sh
```

**Or manually:**
```bash
cd c:\Users\USER\Downloads\FlowIQ
pnpm dev
```

---

**Happy hacking! 🚦**
