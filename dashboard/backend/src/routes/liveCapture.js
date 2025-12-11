const express = require('express');
const pythonClient = require('../services/pythonClient');

const router = express.Router();

// Start live capture
router.post('/start', async (req, res) => {
  try {
    const { sessionId = `live_${Date.now()}`, interface = 'Wi-Fi', refreshRate = 30, lastNSeconds = 0 } = req.body;
    
    const result = await pythonClient.startLiveCapture(sessionId, {
      interface,
      refreshRate,
      lastNSeconds
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop live capture
router.post('/stop', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const result = await pythonClient.stopLiveCapture(sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get live data for a session
router.get('/data/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { lastNSeconds } = req.query;
    
    const data = await pythonClient.getLiveFlows(
      sessionId, 
      lastNSeconds ? parseInt(lastNSeconds) : null
    );
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update session settings
router.put('/settings/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const settings = req.body;
    
    const result = await pythonClient.updateSessionSettings(sessionId, settings);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active sessions
router.get('/sessions', (req, res) => {
  try {
    const sessions = pythonClient.getAllSessions();
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific session info
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionInfo = pythonClient.getSessionInfo(sessionId);
    
    if (!sessionInfo) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(sessionInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;