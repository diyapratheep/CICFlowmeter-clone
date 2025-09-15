const { v4: uuidv4 } = require('uuid');
const pythonClient = require('../services/pythonClient');
const Session = require('../models/Session');

// In-memory session storage (replace with database in production)
const sessions = new Map();

class SessionController {
  // Create and start a new live capture session
  static async startSession(req, res) {
    try {
      const sessionId = uuidv4();
      const config = {
        interface: req.body.interface || 'Wi-Fi',
        refreshRate: req.body.refreshRate || 30,
        lastNSeconds: req.body.lastNSeconds || 0,
        ...req.body
      };

      // Create session model
      const session = new Session(sessionId, config);
      sessions.set(sessionId, session);

      // Start Python worker
      await pythonClient.startLiveCapture(sessionId, config);
      session.start();

      res.json({
        success: true,
        sessionId,
        session: session.toJSON(),
        message: 'Live capture session started successfully'
      });

    } catch (error) {
      console.error('Error starting session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start live capture session',
        details: error.message
      });
    }
  }

  // Stop a live capture session
  static async stopSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Stop Python worker
      await pythonClient.stopLiveCapture(sessionId);
      session.stop();

      res.json({
        success: true,
        sessionId,
        session: session.toJSON(),
        message: 'Live capture session stopped successfully'
      });

    } catch (error) {
      console.error('Error stopping session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stop live capture session',
        details: error.message
      });
    }
  }

  // Get session information
  static getSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        session: session.toJSON()
      });

    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session information',
        details: error.message
      });
    }
  }

  // Get all sessions
  static getAllSessions(req, res) {
    try {
      const allSessions = Array.from(sessions.values()).map(session => session.toJSON());

      res.json({
        success: true,
        sessions: allSessions,
        count: allSessions.length
      });

    } catch (error) {
      console.error('Error getting sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get sessions',
        details: error.message
      });
    }
  }

  // Delete a session
  static deleteSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Stop session if running
      if (session.status === 'running') {
        pythonClient.stopLiveCapture(sessionId).catch(console.error);
      }

      sessions.delete(sessionId);

      res.json({
        success: true,
        sessionId,
        message: 'Session deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete session',
        details: error.message
      });
    }
  }

  // Analyze uploaded PCAP file
  static async analyzePcap(req, res) {
    try {
      const { uploadId } = req.params;
      const { filePath, filename } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: 'File path is required'
        });
      }

      // Create analysis session
      const analysisId = uuidv4();
      const session = new Session(analysisId, { 
        type: 'analysis', 
        filename,
        uploadId 
      });
      sessions.set(analysisId, session);
      session.start();

      // Analyze PCAP file
      const result = await pythonClient.analyzePcapFile(filePath, uploadId);
      session.updateFlowCount(result.flows.length);
      session.stop();

      res.json({
        success: true,
        uploadId,
        analysisId,
        session: session.toJSON(),
        analysis: {
          flows: result.flows,
          stats: result.stats,
          totalFlows: result.flows.length
        }
      });

    } catch (error) {
      console.error('Error analyzing PCAP:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze PCAP file',
        details: error.message
      });
    }
  }
}

module.exports = SessionController;