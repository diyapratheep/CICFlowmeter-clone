import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Settings, Wifi, RefreshCw } from 'lucide-react';

const LiveControl = ({ isCapturing, onStart, onStop, refreshRate }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({
    interface: 'Wi-Fi',
    refreshRate: 30,
    lastNSeconds: 0
  });

  const handleStart = () => {
    onStart(config);
    setShowSettings(false);
  };

  const interfaces = ['Wi-Fi', 'Ethernet', 'Bluetooth', 'USB', 'VPN'];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Capture Control</h2>
        
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-xl transition-all ${
              showSettings 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-purple-300 hover:bg-slate-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="h-5 w-5" />
          </motion.button>

          {!isCapturing ? (
            <motion.button
              onClick={handleStart}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="h-5 w-5" />
              <span>Start Capture</span>
            </motion.button>
          ) : (
            <motion.button
              onClick={onStop}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:from-red-700 hover:to-pink-700 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Square className="h-5 w-5" />
              <span>Stop Capture</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Current Settings Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Wifi className="h-4 w-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">Interface</span>
          </div>
          <p className="text-white font-semibold">{config.interface}</p>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <RefreshCw className="h-4 w-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">Refresh Rate</span>
          </div>
          <p className="text-white font-semibold">{config.refreshRate}s</p>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="w-4 h-4 bg-purple-400 rounded-full"></span>
            <span className="text-purple-300 text-sm font-medium">Time Window</span>
          </div>
          <p className="text-white font-semibold">
            {config.lastNSeconds === 0 ? 'All data' : `${config.lastNSeconds}s`}
          </p>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-purple-500/20 pt-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Capture Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Network Interface */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                Network Interface
              </label>
              <select
                value={config.interface}
                onChange={(e) => setConfig({...config, interface: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-purple-500/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isCapturing}
              >
                {interfaces.map((iface) => (
                  <option key={iface} value={iface}>{iface}</option>
                ))}
              </select>
            </div>

            {/* Refresh Rate */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                Refresh Rate (seconds)
              </label>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={config.refreshRate}
                onChange={(e) => setConfig({...config, refreshRate: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={isCapturing}
              />
              <div className="flex justify-between text-xs text-purple-400 mt-1">
                <span>5s</span>
                <span className="text-white font-medium">{config.refreshRate}s</span>
                <span>120s</span>
              </div>
            </div>

            {/* Time Window */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                Show Last N Seconds (0 = all)
              </label>
              <input
                type="number"
                min="0"
                max="3600"
                step="10"
                value={config.lastNSeconds}
                onChange={(e) => setConfig({...config, lastNSeconds: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-slate-700 border border-purple-500/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0 for all data"
                disabled={isCapturing}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LiveControl;