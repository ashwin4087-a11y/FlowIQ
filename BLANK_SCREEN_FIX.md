# 🔧 FlowIQ Blank Screen - Troubleshooting Guide

## 🚨 The Issue: Seeing Only White/Blank Screen

You see: **Completely blank white page**  
Should see: **Dark navy theme with FlowIQ logo and dashboard**

---

## ⚡ Quick Fix (95% Success Rate)

### **Step 1: Open Browser DevTools**
```
Press: F12 (or Right-click → Inspect)
```

### **Step 2: Go to Console Tab**
```
Look for ANY red error messages
```

### **Step 3: If You See Errors**
Copy the error and share it, OR follow the specific fix below.

### **Step 4: If NO Errors**
Clear cache and hard refresh:
```
Windows: Ctrl+Shift+Delete → Click "Clear All"
Then: Ctrl+Shift+R (hard refresh)
```

---

## 🔍 Common Causes & Fixes

### **Cause #1: CSS Not Loading (Most Common)**

**Symptom**: Page is blank white, no styling at all

**Fix**:
```bash
# Stop server
Ctrl+C in terminal

# Clear cache
rm -rf .vite
pnpm install
pnpm dev

# Then refresh browser (Ctrl+Shift+R)
```

---

### **Cause #2: Module Not Found Error**

**Error in console**: `Cannot find module '@/...'`

**Fix**:
```bash
# Reinstall dependencies
pnpm install --force

# Or complete reset:
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

---

### **Cause #3: React Rendering Error**

**Error in console**: `Uncaught Error: ...` or `Uncaught ReferenceError`

**Fix**:
**Option A**: Use test app (simpler)
```bash
# Edit: src/main.tsx

# Change this:
import App from './app/App.tsx'

# To this:
import App from './app/AppTest.tsx'

# Save & refresh
```

**Option B**: Check App.tsx for import errors
```bash
# Check for missing components:
- Do all imports exist?
- Are all component files present?
- No syntax errors?
```

---

### **Cause #4: Port Already in Use**

**Symptom**: Can't connect to localhost:5173

**Fix**:
```bash
# Use different port
vite --port 3000

# Visit: http://localhost:3000
```

---

### **Cause #5: Browser Cache Corrupted**

**Symptom**: Works on other browsers but not yours

**Fix**:
```
Firefox/Chrome:
- Settings → Privacy
- Clear browsing data
- Select: Cache, Cookies, localStorage
- Clear All

OR use Incognito/Private window
```

---

## 🧪 Test URLs (In Order)

Try each URL in this order:

```
1. http://localhost:5173/DIAGNOSTIC.html
   → If this works: Server is fine, React issue

2. http://localhost:5173/flowiq-enhanced-routes.html  
   → If this works: Static files are fine, React issue

3. http://localhost:5173/
   → Main app (currently broken?)
```

---

## 🔬 Deep Diagnostics

### **Check Console for Specific Errors**

**Error Contains "Cannot find module"?**
```bash
pnpm install
pnpm dev
```

**Error Contains "Unexpected token"?**
```bash
rm -rf .vite node_modules
pnpm install
pnpm dev
```

**Error Contains "React is not defined"?**
```bash
# In src/main.tsx, ensure it has:
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
```

**No error but still blank?**
```
Check under Application tab (F12)
Look for "index.css" and "tailwind.css"
If missing → CSS loading failed
```

---

## 🧹 Nuclear Option (Complete Reset)

**If nothing above works:**

```bash
# Navigate to project
cd c:\Users\USER\Downloads\FlowIQ

# Kill everything
taskkill /F /IM node.exe    # Windows
# killall node               # Mac/Linux

# Remove all build artifacts
rmdir /s /q node_modules
del pnpm-lock.yaml
del package-lock.json
rmdir /s /q .vite
rmdir /s /q dist

# Reinstall fresh
pnpm install

# Start dev server
pnpm dev

# Clear browser cache (Ctrl+Shift+Delete)
# Hard refresh (Ctrl+Shift+R)
```

---

## ✅ Verification Checklist

Once it's working, you should see:

- [ ] **Page loads** (not blank)
- [ ] **Dark theme** (navy background #0F172A)
- [ ] **FlowIQ logo** in top-left
- [ ] **Dashboard/Mobile buttons** in header
- [ ] **Sidebar** on left
- [ ] **No red errors** in console
- [ ] **"System Online"** indicator (green dot)

---

## 📊 Expected Screen

```
┌─────────────────────────────────────────┐
│ 🟢 FlowIQ          [Dashboard][Mobile]  │ ← Header
├─────────────────────────────────────────┤
│ ▮                                       │
│ ▮ Overview        ┌──────────────────┐ │
│ ▮ Signals         │  Main content    │ │
│ ▮ Routing         │  Goes here       │ │
│ ▮ Surge           │                  │ │
│ ▮ Hardware        └──────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🚀 Test App Fallback

If main app won't load, try simpler test:

```bash
# Edit src/main.tsx line 4:

# Current:
import App from './app/App.tsx'

# Change to:
import App from './app/AppTest.tsx'

# Save & refresh browser
```

This shows a simple working React app to verify the setup.

---

## 📞 If Still Stuck

1. **Screenshot console errors** (F12 → Console → red texts)
2. **Check**: 
   - `http://localhost:5173/DIAGNOSTIC.html` works?
   - `http://localhost:5173/flowiq-enhanced-routes.html` works?
3. **What's the error text?**
4. **Which step did it fail on?**

---

## 🎯 Next Steps (Once Fixed)

Once you see the dark dashboard:

1. ✅ Main app working
2. View routes: Visit `/flowiq-enhanced-routes.html`
3. Try clicking buttons in sidebar
4. Check different views (Dashboard / Mobile App)

---

## 📝 Notes

- **Blank white page** = CSS not loading
- **Blank with console errors** = JavaScript error
- **Other content visible but parts missing** = Component import issue
- **Works in different browser** = Local cache issue

---

**Version**: 1.0  
**Date**: April 2026  
**Status**: Ready to troubleshoot ✅
