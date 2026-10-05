import 'reflect-metadata';
import { backendRoot } from './src/config/env';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import db, { initializeDatabase } from './src/config/database';
import adminRoutes from './src/routes/adminRoutes';
import voteRoutes from './src/routes/voteRoutes';
import userRoutes from './src/routes/userRoutes';
import stateRoutes from './src/routes/stateRoutes';
import path from 'node:path';

const app = express();
const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || '0.0.0.0';

app.use(express.json());
app.use(cookieParser());

// CORS setup
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://premios-lola.web.app',
  ...(process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean),
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Register routes
app.get('/health', async (_req, res) => {
  try {
    await db.promise().query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});
app.use('/', adminRoutes);
app.use('/', stateRoutes);
app.use('/', userRoutes);
app.use('/', voteRoutes);
app.use('/static', express.static(path.join(backendRoot, 'public')));

// Start server
initializeDatabase().then(() => {
  const server = app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
  });
  server.on('error', error => {
    console.error('API failed to listen:', error.message);
    db.end();
    process.exitCode = 1;
  });
}).catch(error => {
  console.error('Database startup failed:', error.message);
  db.end();
  process.exitCode = 1;
});
