import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Settings, Clock, Activity, AlertTriangle } from 'lucide-react';
import LiveChart from '../components/Charts/LiveChart';
import FlowTable from '../components/FlowTable';
import LiveControl from '../components/LiveControl';

const Live = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [refreshRate, setRefreshRate] = useState(30);
  const [flows, setFlows] = useState([]);
  const [stats, setStats] = useState({
    totalFlows: 0,
    webCount: 0,
    multimediaCount: 0,
    socialCount: 0,
    maliciousCount: 0
  });
  
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  // Mock data generation for demonstration
  const generateMockFlows = () => {
    const classes = ['Web', 'Multimedia', 'Social Media', 'Malicious'];
    const protocols = ['TCP', 'UDP'];
    const mockFlows = [];

    for (let i = 0; i < Math.floor(Math.random() * 10) + 5; i++) {
      mockFlows.push({
        id: Date.now() + i,
        srcIP: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        dstIP: `10.0.0.${Math.floor(Math.random() * 254) + 1}`,
        srcPort: Math.floor(Math.random() * 65535),
        dstPort: Math.floor(Math.random() * 65535),
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        prediction: classes[Math.floor(Math.random() * classes.length)],
        duration: (Math.random() * 100).toFixed(2),
        bytes: Math.floor(Math.random() * 10000),
        packets: Math.floor(Math.random() * 100),
        timestamp: new Date().toISOString()
      });
    }

    return mockFlows;
  };

  const updateStats = (flowData) => {
    const newStats = {
      totalFlows: flowData.length,
      webCount: flowData.filter(f => f.prediction === 'Web').length,
      multimediaCount: flowData.filter(f => f.prediction === 'Multimedia').length,
      socialCount: flowData.filter(f => f.prediction === 'Social Media').length,
      maliciousCount: flowData.filter(f => f.prediction === 'Malicious').length
    };
    setStats(newStats);
  };

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let timer;
    if (isCapturing && sessionStartTime) {
      timer = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - sessionStartTime) / 1000);
        setElapsedTime(formatElapsedTime(elapsed));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCapturing, sessionStartTime]);

  useEffect(() => {
    if (isCapturing) {
      const interval = setInterval(() => {
        const newFlows = generateMockFlows();
        setFlows(prevFlows => {
          const updatedFlows = [...prevFlows, ...newFlows];
          updateStats(updatedFlows);
          return updatedFlows;
        });
      }, refreshRate * 1000);
      
      intervalRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [isCapturing, refreshRate]);

  const handleStartCapture = (config) => {
    setIsCapturing(true);
    setSessionStartTime(Date.now());
    setRefreshRate(config.refreshRate);
    setFlows([]);
    setStats({
      totalFlows: 0,
      webCount: 0,
      multimediaCount: 0,
      socialCount: 0,
      maliciousCount: 0
    });
  };

  const handleStopCapture = () => {
    setIsCapturing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Live Traffic Capture</h1>
            <p className="text-purple-300">Real-time network flow classification and monitoring</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              isCapturing ? 'bg-green-600/20 text-green-400' : 'bg-slate-700/50 text-purple-300'
            }`}>
              <div className={`w-3 h-3 rounded-full ${isCapturing ? 'bg-green-400 animate-pulse' : 'bg-purple-400'}`} />
              <span className="font-medium">{isCapturing ? 'Capturing' : 'Stopped'}</span>
            </div>
            
            {isCapturing && (
              <div className="flex items-center space-x-2 text-purple-300">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg">{elapsedTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="mb-8">
          <LiveControl
            isCapturing={isCapturing}
            onStart={handleStartCapture}
            onStop={handleStopCapture}
            refreshRate={refreshRate}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">Total Flows</p>
                <p className="text-white text-2xl font-bold">{stats.totalFlows}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Web Traffic</p>
                <p className="text-white text-2xl font-bold">{stats.webCount}</p>
              </div>
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Multimedia</p>
                <p className="text-white text-2xl font-bold">{stats.multimediaCount}</p>
              </div>
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm">Social Media</p>
                <p className="text-white text-2xl font-bold">{stats.socialCount}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Malicious</p>
                <p className="text-white text-2xl font-bold">{stats.maliciousCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Charts and Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
            <h3 className="text-xl font-bold text-white mb-4">Traffic Distribution</h3>
            <LiveChart data={stats} />
          </div>

          {/* Flow Table */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
            <h3 className="text-xl font-bold text-white mb-4">Recent Flows</h3>
            <FlowTable flows={flows.slice(-10)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Live;