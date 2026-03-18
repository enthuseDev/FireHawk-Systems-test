const express = require('express');
const cors = require('cors');

function createServer() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      service: 'firehawk-backend',
      time: new Date().toISOString()
    });
  });

  return app;
}

module.exports = { createServer };

