import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { corsMiddleware } from './middleware/cors.js';
import errorHandler from './middleware/errorHandler.js';
import projectRoutes from './routes/projectRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import authRoutes from './routes/authRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import { setupSocket } from './socket/socketHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  },
});

// ── Middleware ────────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.use(express.json({ limit: '2mb' }));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── Socket.io ─────────────────────────────────────────────────────────────
setupSocket(io);

// ── Error Handler ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
