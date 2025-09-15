import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, Trash2, Eye, FileText, Clock } from 'lucide-react';

const History = () => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Generate mock history data
    const mockSessions = [];
    for (let i = 0; i < 10; i++) {
      mockSessions.push({
        id: i + 1,
        type: Math.random() > 0.5 ? 'Live Capture' : 'PCAP Upload',
        filename: Math.random() > 0.5 ? `capture_${Date.now() + i}.pcap` : `network_trace_${i + 1}.pcap`,
        startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: Math.floor(Math.random() * 3600) + 60, // 1 min to 1 hour
        totalFlows: Math.floor(Math.random() * 1000) + 100,
        maliciousFlows: Math.floor(Math.random() * 50),
        fileSize: Math.floor(Math.random() * 100) + 10 // 10-110 MB
      });
    }
    setSessions(mockSessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)));
  }, []);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatFileSize = (mb) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDelete = (sessionId) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Analysis History</h1>
          <p className="text-purple-300">View and manage your previous network analysis sessions</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">Total Sessions</p>
                <p className="text-white text-2xl font-bold">{sessions.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Total Flows</p>
                <p className="text-white text-2xl font-bold">
                  {sessions.reduce((sum, s) => sum + s.totalFlows, 0).toLocaleString()}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Threats Found</p>
                <p className="text-white text-2xl font-bold">
                  {sessions.reduce((sum, s) => sum + s.maliciousFlows, 0)}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-red-500 rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Data Processed</p>
                <p className="text-white text-2xl font-bold">
                  {formatFileSize(sessions.reduce((sum, s) => sum + s.fileSize, 0))}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
          <div className="p-6 border-b border-purple-500/20">
            <h2 className="text-2xl font-bold text-white">Recent Sessions</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Flows
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Threats
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/20">
                {sessions.map((session, index) => (
                  <motion.tr
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-600/20 rounded-lg mr-3">
                          <FileText className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{session.filename}</div>
                          <div className="text-sm text-purple-300">Session #{session.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.type === 'Live Capture' 
                          ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                          : 'bg-blue-900/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {session.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-300">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(session.startTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-300">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatDuration(session.duration)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {session.totalFlows.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        session.maliciousFlows > 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {session.maliciousFlows}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-300">
                      {formatFileSize(session.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-purple-400 hover:text-purple-300 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(session.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default History;