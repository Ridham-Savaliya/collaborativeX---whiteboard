import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { setupSocket } from './socket';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load the env file from the root
dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH'],
    credentials:true
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
