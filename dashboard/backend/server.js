const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs-extra');

const app = require('./src/app'); // API routes, middleware, etc.
const PORT = process.env.PORT || 3001;

// --------------------
// Request logging middleware
// --------------------
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// --------------------
// WebSocket setup
// --------------------
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const wsConnections = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  wsConnections.add(ws);

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    wsConnections.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    wsConnections.delete(ws);
  });
});

// Broadcast function
global.broadcast = (data) => {
  const message = JSON.stringify(data);
  wsConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(message, (err) => err && console.error(err));
  });
};

// --------------------
// Ensure required directories
// --------------------
const ensureDirectories = async () => {
  const dirs = [
    path.join(__dirname, '..', 'data'),
    path.join(__dirname, '..', 'models'),
    path.join(__dirname, 'uploads')
  ];

  for (const dir of dirs) {
    console.log(`Ensuring directory exists: ${dir}`);
    await fs.ensureDir(dir);
  }
};

// --------------------
// Serve React build
// --------------------
const publicPath = path.join(__dirname, 'public'); // backend/public
console.log(`Serving React static files from: ${publicPath}`);
app.use(express.static(publicPath));

// Catch-all route for SPA
app.get('*', (req, res) => {
  const indexFile = path.join(publicPath, 'index.html');
  console.log(`Catch-all route hit for: ${req.url}`);
  res.sendFile(indexFile, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

// --------------------
// Start server
// --------------------
const startServer = async () => {
  try {
    await ensureDirectories();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready for real-time updates`);
      console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

// --------------------
// Graceful shutdown
// --------------------
const shutdown = () => {
  console.log('Shutting down gracefully...');
  wsConnections.forEach((ws) => ws.close());
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
