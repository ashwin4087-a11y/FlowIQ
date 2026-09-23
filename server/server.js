import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import apiRoutes from './routes/api.js';
import { setupTrafficStream } from './sockets/trafficStream.js';
import { getState, patchState, persistBrain, refreshSystemFields } from './services/flowiqState.js';
import { getAudioModelInfo } from './services/audioService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const corsOrigin = process.env.CORS_ORIGIN || '*';

const io = new Server(server, {
  cors: {
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2000,
  message: 'Too many requests, please try again later.',
});
app.use('/api', limiter);

app.use('/api', apiRoutes);
setupTrafficStream(io);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const USE_MONGODB = process.env.USE_MONGODB === 'true';

function startServer() {
  const audio = getAudioModelInfo();
  patchState({
    system: {
      ...getState().system,
      backend: 'online',
      audioModel: audio.loaded ? 'ready' : 'not_loaded',
      mongodb: MONGODB_URI ? 'configured' : 'optional_offline',
    },
  });

  server.listen(PORT, () => {
    refreshSystemFields();
    persistBrain({ skipRl: true });
    console.log(`FlowIQ server running on port ${PORT}`);
    console.log(`Audio model: ${audio.loaded ? 'loaded' : 'NOT LOADED'}`);
  });
}

if (USE_MONGODB && MONGODB_URI && MONGODB_URI.trim() !== '') {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      const current = getState();
      patchState({ system: { ...current.system, mongodb: 'online' } });
      startServer();
    })
    .catch((err) => {
      console.warn('MongoDB connection failed — running without persistence:', err.message);
      startServer();
    });
} else {
  console.log('MongoDB disabled (set USE_MONGODB=true to enable) — in-memory state only');
  startServer();
}
