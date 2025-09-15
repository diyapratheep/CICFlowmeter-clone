const express = require('express');
const pythonClient = require('../services/pythonClient');

const router = express.Router();

// Get flows for a specific session
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { lastNSeconds } = req.query;
    
    const lastN = lastNSeconds ? parseInt(lastNSeconds) : null;
    const result = await pythonClient.getLiveFlows(sessionId, lastN);
    
    res.json({
      success: true,
      sessionId,
      ...result
    });

  } catch (error) {
    console.error('Error getting flows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get flows',
      details: error.message
    });
  }
});

// Get flow statistics for a session
router.get('/:sessionId/stats', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { lastNSeconds } = req.query;
    
    const lastN = lastNSeconds ? parseInt(lastNSeconds) : null;
    const result = await pythonClient.getLiveFlows(sessionId, lastN);
    
    res.json({
      success: true,
      sessionId,
      stats: result.stats
    });

  } catch (error) {
    console.error('Error getting flow stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get flow statistics',
      details: error.message
    });
  }
});

module.exports = router;