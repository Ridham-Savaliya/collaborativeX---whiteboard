import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { setupSocket } from './socket';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the env file from the root
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH'],
  }
});

setupSocket(io);

app.get('/', (req, res) => {
  res.send('Hello World');
});

const PORT = process.env.SERVER_PORT || 3002;

httpServer.listen(PORT, () => {
  console.log(`WebSocket and Backend-server is running on port ${PORT}`)
});
