// const { spawn } = require('child_process');
// const path = require('path');
// const fs = require('fs-extra');

// class PythonClient {
//   constructor() {
//     this.workerPath = path.join(__dirname, '..', '..', '..', 'worker');
//     this.dataPath = path.join(__dirname, '..', '..', '..', 'data'); 
//     this.activeSessions = new Map();
//   }

//   async startLiveCapture(sessionId, config = {}) {
//     const { interface: iface = 'Wi-Fi', refreshRate = 30, lastNSeconds = null } = config;
//     const outputFile = path.join(this.dataPath, `liveflows_${sessionId}.csv`);

//     const pythonProcess = spawn('python', ['pcap2csv_win_new.py', '--live', '--iface', iface, '-o', outputFile], { cwd: this.workerPath });
//     this.activeSessions.set(sessionId, { process: pythonProcess, outputFile, config, startTime: new Date(), status: 'running' });

//     pythonProcess.stdout.on('data', data => console.log(`Live capture ${sessionId}:`, data.toString()));
//     pythonProcess.stderr.on('data', data => console.error(`Live capture ${sessionId} error:`, data.toString()));
//     pythonProcess.on('close', code => {
//       console.log(`Live capture ${sessionId} exited with code ${code}`);
//       const session = this.activeSessions.get(sessionId);
//       if (session) session.status = 'stopped';
//     });

//     this.startPeriodicClassification(sessionId, refreshRate, lastNSeconds);
//     return { success: true, sessionId, message: 'Live capture started' };
//   }

//   async stopLiveCapture(sessionId) {
//     const session = this.activeSessions.get(sessionId);
//     if (!session) throw new Error('Session not found');
//     if (session.process && !session.process.killed) session.process.kill('SIGINT');
//     if (session.classificationInterval) clearInterval(session.classificationInterval);
//     session.status = 'stopped';
//     return { success: true, sessionId, message: 'Live capture stopped' };
//   }

//   startPeriodicClassification(sessionId, refreshRate, lastNSeconds) {
//     const session = this.activeSessions.get(sessionId);
//     if (!session) return;
//     const classifyAndBroadcast = async () => {
//       try {
//         const flows = await this.classifyFlows(session.outputFile, lastNSeconds);
//         if (global.broadcast) global.broadcast({
//           type: 'live_update',
//           sessionId,
//           data: { flows: flows.slice(-10), stats: this.calculateStats(flows), timestamp: new Date().toISOString() }
//         });
//       } catch (err) { console.error('Periodic classification error:', err); }
//     };
//     setTimeout(classifyAndBroadcast, 5000);
//     session.classificationInterval = setInterval(classifyAndBroadcast, refreshRate * 1000);
//   }

//   async analyzePcapFile(filePath, uploadId) {
//     const absPath = path.isAbsolute(filePath) ? filePath : path.join(this.dataPath, filePath);
//     if (!await fs.pathExists(absPath)) return { success: false, uploadId, message: "PCAP not found", flows: [], stats: {}, outputFile: null };
//     const outputFile = path.join(this.dataPath, `analysis_${uploadId}.csv`);

//     const args = ['pcap2csv_win_new.py', '-i', absPath, '-o', outputFile];
//     return new Promise((resolve) => {
//       const pythonProcess = spawn('python', args, { cwd: this.workerPath });
//       let stdout = '', stderr = '';
//       pythonProcess.stdout.on('data', data => stdout += data.toString());
//       pythonProcess.stderr.on('data', data => stderr += data.toString());

//       pythonProcess.on('close', async (code) => {
//         if (code !== 0) return resolve({ success: false, uploadId, message: stderr, flows: [], stats: {}, outputFile });

//         try {
//           const flows = await this.classifyFlows(outputFile);
//           if (!flows || flows.length === 0) return resolve({ success: false, uploadId, message: "No flows found", flows: [], stats: {}, outputFile });
//           resolve({ success: true, uploadId, flows, stats: this.calculateStats(flows), outputFile });
//         } catch (err) {
//           resolve({ success: false, uploadId, message: err.message, flows: [], stats: {}, outputFile });
//         }
//       });
//     });
//   }

//   async classifyFlows(csvFile, lastNSeconds = null) {
//     if (!await fs.pathExists(csvFile)) return [];
//     const escapedCsv = csvFile.replace(/\\/g, '\\\\');
//     const pythonLastN = lastNSeconds === null ? 'None' : lastNSeconds;

//     const code = `
// import sys, json, traceback
// sys.path.append(r'${this.workerPath.replace(/\\/g, '\\\\')}')
// from classifier_core import classify_flows

// try:
//     df = classify_flows(r'${escapedCsv}', ${pythonLastN})
//     flows = df.to_dict('records') if df is not None else []
// except Exception as e:
//     flows = []
//     print("Python classify_flows error:", str(e), file=sys.stderr)

// print(json.dumps(flows))
// `;

//     return new Promise((resolve) => {
//       const pythonProcess = spawn('python', ['-c', code], { cwd: this.workerPath });
//       let stdout = '', stderr = '';
//       pythonProcess.stdout.on('data', data => stdout += data.toString());
//       pythonProcess.stderr.on('data', data => stderr += data.toString());

//       pythonProcess.on('close', () => {
//         try {
//           const result = JSON.parse(stdout);
//           resolve(Array.isArray(result) ? result : []);
//         } catch (err) {
//           console.error('Error parsing Python result:', err, 'stderr:', stderr);
//           resolve([]);
//         }
//       });
//     });
//   }

//   calculateStats(flows) {
//     if (!flows || flows.length === 0) return { totalFlows: 0, webCount: 0, multimediaCount: 0, socialCount: 0, maliciousCount: 0 };
//     return {
//       totalFlows: flows.length,
//       webCount: flows.filter(f => f.Prediction === 'Web').length,
//       multimediaCount: flows.filter(f => f.Prediction === 'Multimedia').length,
//       socialCount: flows.filter(f => f.Prediction === 'Social Media').length,
//       maliciousCount: flows.filter(f => f.Prediction === 'Malicious').length
//     };
//   }

//   async getLiveFlows(sessionId, lastNSeconds = null) {
//     const session = this.activeSessions.get(sessionId);
//     if (!session) throw new Error('Session not found');
//     const flows = await this.classifyFlows(session.outputFile, lastNSeconds);
//     return { flows, stats: this.calculateStats(flows) };
//   }

//   getSessionInfo(sessionId) {
//     const session = this.activeSessions.get(sessionId);
//     return session ? { sessionId, status: session.status, startTime: session.startTime, config: session.config } : null;
//   }

//   getAllSessions() {
//     return Array.from(this.activeSessions.entries()).map(([id, s]) => ({ sessionId: id, status: s.status, startTime: s.startTime, config: s.config }));
//   }
// }

// module.exports = new PythonClient();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

class PythonClient {
  constructor() {
    this.workerPath = path.join(__dirname, '..', '..', '..', 'worker');
    this.dataPath = path.join(__dirname, '..', '..', '..', 'data'); 
    this.activeSessions = new Map();


    //const venvPath = path.join(__dirname, '..', '..', '..', 'venv');
    // Determine Python executable
    if (os.platform() === 'win32') {
      this.pythonCmd = 'python'; // Windows Python launcher //was py
    } else {
      this.pythonCmd = 'python3'; // macOS/Linux
    }
  }

  spawnPython(args, cwd) {
    // Always add '-3' for py launcher to force Python 3
    if (this.pythonCmd === 'py') args.unshift('-3');
    return spawn(this.pythonCmd, args, { cwd });
  }

  /** ===================== LIVE CAPTURE ===================== **/
  async startLiveCapture(sessionId, config = {}) {
    const { interface: iface = 'Wi-Fi', refreshRate = 30, lastNSeconds = null } = config;
    const outputFile = path.join(this.dataPath, `liveflows_${sessionId}.csv`);

    console.log(`[LIVE] Starting capture for session: ${sessionId}`);
    const pythonProcess = this.spawnPython(['pcap2csv_win_new.py', '--live', '--iface', iface, '-o', outputFile], this.workerPath);

    this.activeSessions.set(sessionId, { process: pythonProcess, outputFile, config, startTime: new Date(), status: 'running' });

    pythonProcess.stdout.on('data', data => console.log(`[LIVE ${sessionId}] stdout:`, data.toString()));
    pythonProcess.stderr.on('data', data => console.error(`[LIVE ${sessionId}] stderr:`, data.toString()));
    pythonProcess.on('close', code => {
      console.log(`[LIVE ${sessionId}] process exited with code ${code}`);
      const session = this.activeSessions.get(sessionId);
      if (session) session.status = 'stopped';
    });

    this.startPeriodicClassification(sessionId, refreshRate, lastNSeconds);
    return { success: true, sessionId, message: 'Live capture started' };
  }

  async stopLiveCapture(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.process && !session.process.killed) session.process.kill('SIGINT');
    if (session.classificationInterval) clearInterval(session.classificationInterval);
    session.status = 'stopped';
    console.log(`[LIVE] Stopped capture for session: ${sessionId}`);
    return { success: true, sessionId, message: 'Live capture stopped' };
  }

  /** ===================== PERIODIC CLASSIFICATION ===================== **/
  startPeriodicClassification(sessionId, refreshRate, lastNSeconds) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const classifyAndBroadcast = async () => {
      try {
        const flows = await this.classifyFlows(session.outputFile, lastNSeconds);
        if (!flows || flows.length === 0) return console.warn(`[LIVE ${sessionId}] No flows extracted`);

        const stats = this.calculateStats(flows);
        console.log(`[LIVE ${sessionId}] Broadcast stats:`, stats);

        if (global.broadcast) {
          global.broadcast({
            type: 'live_update',
            sessionId,
            data: { flows: flows.slice(-10), stats, timestamp: new Date().toISOString() }
          });
        }
      } catch (err) {
        console.error(`[LIVE ${sessionId}] Periodic classification error:`, err);
      }
    };

    setTimeout(classifyAndBroadcast, 5000);
    session.classificationInterval = setInterval(classifyAndBroadcast, refreshRate * 1000);
  }

  /** ===================== ANALYZE PCAP ===================== **/
  async analyzePcapFile(filePath, uploadId) {
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(this.dataPath, filePath);
    console.log(`[ANALYZE] PCAP file: ${absPath}`);
    if (!await fs.pathExists(absPath)) return { success: false, uploadId, message: "PCAP not found", flows: [], stats: {}, outputFile: null };

    const outputFile = path.join(this.dataPath, `analysis_${uploadId}.csv`);
    console.log(`[ANALYZE] Output CSV: ${outputFile}`);

    const args = ['pcap2csv_win_new.py', '-i', absPath, '-o', outputFile];
    return new Promise(resolve => {
      const pythonProcess = this.spawnPython(args, this.workerPath);
      let stdout = '', stderr = '';
      pythonProcess.stdout.on('data', data => stdout += data.toString());
      pythonProcess.stderr.on('data', data => stderr += data.toString()); 

      pythonProcess.on('close', async (code) => {
        console.log(`[ANALYZE] Python process exited with code ${code}`);
        if (code !== 0) {
          console.error(`[ANALYZE] Python stderr:`, stderr);
          return resolve({ success: false, uploadId, message: stderr, flows: [], stats: {}, outputFile });
        }

        try {
          const flows = await this.classifyFlows(outputFile);
          if (!flows || flows.length === 0) return resolve({ success: false, uploadId, message: "No flows found", flows: [], stats: {}, outputFile });
          console.log(`[ANALYZE] Flows classified: ${flows.length}`);
          resolve({ success: true, uploadId, flows, stats: this.calculateStats(flows), outputFile });
        } catch (err) {
          console.error(`[ANALYZE] Classification error:`, err);
          resolve({ success: false, uploadId, message: err.message, flows: [], stats: {}, outputFile });
        }
      });
    }); 
  } 

  /** ===================== CLASSIFY FLOWS ===================== **/
  async classifyFlows(csvFile, lastNSeconds = null) {
    if (!await fs.pathExists(csvFile)) return [];

    const escapedCsv = csvFile.replace(/\\/g, '\\\\');
    const pythonLastN = lastNSeconds === null ? 'None' : lastNSeconds;
    const escapedWorker = this.workerPath.replace(/\\/g, '\\\\');

    const code = `
import sys, json, traceback
sys.path.append(r'${escapedWorker}')
from classifier_core import classify_flows

df = None
flows = []

try:
    df = classify_flows(r'${escapedCsv}', ${pythonLastN})
    if df is not None and not df.empty:
        flows = df.to_dict('records')
except Exception as e:
    print("[PYTHON ERROR] classify_flows exception:", e, file=sys.stderr)
    traceback.print_exc(file=sys.stderr)

print(json.dumps(flows))
`;

    return new Promise(resolve => {
      const pythonProcess = this.spawnPython(['-c', code], this.workerPath);
      let stdout = '', stderr = '';

      pythonProcess.stdout.on('data', data => stdout += data.toString());
      pythonProcess.stderr.on('data', data => stderr += data.toString());

      pythonProcess.on('close', () => {
        if (stderr) console.error('[PYTHON STDERR]:', stderr);
        try {
          const result = JSON.parse(stdout);
          resolve(Array.isArray(result) ? result : []);
        } catch (err) {
          console.error('Error parsing Python result:', err, 'stdout:', stdout);
          resolve([]);
        }
      });
    });
  }

  /** ===================== STATS ===================== **/
  calculateStats(flows) {
    if (!flows || flows.length === 0) return { totalFlows: 0, webCount: 0, multimediaCount: 0, socialCount: 0, maliciousCount: 0 };
    return {
      totalFlows: flows.length,
      webCount: flows.filter(f => f.Prediction === 'Web').length,
      multimediaCount: flows.filter(f => f.Prediction === 'Multimedia').length,
      socialCount: flows.filter(f => f.Prediction === 'Social Media').length,
      maliciousCount: flows.filter(f => f.Prediction === 'Malicious').length
    };
  }

  async getLiveFlows(sessionId, lastNSeconds = null) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    const flows = await this.classifyFlows(session.outputFile, lastNSeconds);
    return { flows, stats: this.calculateStats(flows) };
  }

  getSessionInfo(sessionId) {
    const session = this.activeSessions.get(sessionId);
    return session ? { sessionId, status: session.status, startTime: session.startTime, config: session.config } : null;
  }

  getAllSessions() {
    return Array.from(this.activeSessions.entries()).map(([id, s]) => ({ sessionId: id, status: s.status, startTime: s.startTime, config: s.config }));
  }
}

module.exports = new PythonClient(); 
 