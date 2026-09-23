# Deployment

## Frontend (Vercel)

- Root: repository root
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://your-render-service.onrender.com`

## Backend (Render)

- Root: `server`
- Start: `npm start`
- Env: `PORT`, `CORS_ORIGIN=https://your-vercel-app.vercel.app`
- MongoDB: optional (`MONGODB_URI` empty = in-memory only)

## Audio model

Train on a workstation with datasets locally. Upload `siren_cnn.pt` to the backend filesystem or mount volume; set `MODEL_PATH` and install Python + `ml/audio/requirements.txt` on the Render instance **only if** you deploy inference there.

Otherwise leave model unset — API returns `model_not_loaded`.
