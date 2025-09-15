import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import FlowTable from '../components/FlowTable';
import HistoryChart from '../components/Charts/HistoryChart';

const Upload = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = async (file) => {
    setUploadedFile(file);
    setIsAnalyzing(true);

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate mock analysis result
    const mockFlows = [];
    const classes = ['Web', 'Multimedia', 'Social Media', 'Malicious'];
    const protocols = ['TCP', 'UDP'];

    for (let i = 0; i < 50; i++) {
      mockFlows.push({
        id: i + 1,
        srcIP: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        dstIP: `10.0.0.${Math.floor(Math.random() * 254) + 1}`,
        srcPort: Math.floor(Math.random() * 65535),
        dstPort: Math.floor(Math.random() * 65535),
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        prediction: classes[Math.floor(Math.random() * classes.length)],
        duration: (Math.random() * 100).toFixed(2),
        bytes: Math.floor(Math.random() * 10000),
        packets: Math.floor(Math.random() * 100),
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
      });
    }

    const stats = {
      totalFlows: mockFlows.length,
      webCount: mockFlows.filter(f => f.prediction === 'Web').length,
      multimediaCount: mockFlows.filter(f => f.prediction === 'Multimedia').length,
      socialCount: mockFlows.filter(f => f.prediction === 'Social Media').length,
      maliciousCount: mockFlows.filter(f => f.prediction === 'Malicious').length
    };

    setAnalysisResult({
      flows: mockFlows,
      stats: stats,
      filename: file.name,
      fileSize: file.size,
      analysisTime: '2.3 seconds'
    });
    
    setIsAnalyzing(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <h1 className="text-4xl font-bold text-white mb-2">PCAP File Analysis</h1>
          <p className="text-purple-300">Upload and analyze packet capture files for traffic classification</p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <FileUpload onFileUpload={handleFileUpload} isAnalyzing={isAnalyzing} />
        </div>

        {/* Analysis Status */}
        {uploadedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 mb-8"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{uploadedFile.name}</h3>
                  <p className="text-purple-300 text-sm">{formatFileSize(uploadedFile.size)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-purple-400">Analyzing...</span>
                  </>
                ) : analysisResult ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-green-400">Analysis Complete</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <span className="text-yellow-400">Pending</span>
                  </>
                )}
              </div>
            </div>

            {analysisResult && (
              <div className="mt-4 pt-4 border-t border-purple-500/20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-purple-300">Total Flows</p>
                    <p className="text-white font-semibold">{analysisResult.stats.totalFlows}</p>
                  </div>
                  <div>
                    <p className="text-purple-300">Analysis Time</p>
                    <p className="text-white font-semibold">{analysisResult.analysisTime}</p>
                  </div>
                  <div>
                    <p className="text-purple-300">Malicious Detected</p>
                    <p className={`font-semibold ${analysisResult.stats.maliciousCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {analysisResult.stats.maliciousCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-purple-300">File Size</p>
                    <p className="text-white font-semibold">{formatFileSize(analysisResult.fileSize)}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Results */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm">Web Traffic</p>
                    <p className="text-white text-2xl font-bold">{analysisResult.stats.webCount}</p>
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
                    <p className="text-white text-2xl font-bold">{analysisResult.stats.multimediaCount}</p>
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
                    <p className="text-white text-2xl font-bold">{analysisResult.stats.socialCount}</p>
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
                    <p className="text-white text-2xl font-bold">{analysisResult.stats.maliciousCount}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
              </div>
            </div>

            {/* Chart and Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-bold text-white mb-4">Traffic Distribution</h3>
                <HistoryChart data={analysisResult.stats} />
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-bold text-white mb-4">Flow Details</h3>
                <FlowTable flows={analysisResult.flows.slice(0, 10)} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Upload;