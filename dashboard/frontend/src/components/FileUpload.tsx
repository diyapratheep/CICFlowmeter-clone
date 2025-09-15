import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isAnalyzing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isAnalyzing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, []);

  const handleFiles = (files: FileList) => {
    const file = files[0];
    setError(null);

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pcap') && !file.name.toLowerCase().endsWith('.pcapng')) {
      setError('Please select a valid PCAP file (.pcap or .pcapng)');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
      <h2 className="text-2xl font-bold text-white mb-6">Upload PCAP File</h2>
      
      {!selectedFile ? (
        <motion.div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragActive 
              ? 'border-purple-400 bg-purple-900/20' 
              : 'border-purple-500/30 hover:border-purple-400/50 hover:bg-slate-700/30'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            type="file"
            accept=".pcap,.pcapng"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isAnalyzing}
          />
          
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl">
              <Upload className="h-12 w-12 text-white" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Drop your PCAP file here
              </h3>
              <p className="text-purple-300 mb-4">
                or click to browse your computer
              </p>
              <p className="text-sm text-purple-400">
                Supports .pcap and .pcapng files up to 100MB
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Selected File Display */}
          <div className="bg-slate-700/50 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <File className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">{selectedFile.name}</h4>
                  <p className="text-purple-300 text-sm">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              
              {!isAnalyzing && (
                <button
                  onClick={removeFile}
                  className="p-2 text-purple-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex justify-center">
            <motion.button
              onClick={handleUpload}
              disabled={isAnalyzing}
              className={`px-8 py-3 rounded-xl font-medium transition-all ${
                isAnalyzing
                  ? 'bg-purple-600/50 text-purple-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/25'
              }`}
              whileHover={!isAnalyzing ? { scale: 1.05 } : {}}
              whileTap={!isAnalyzing ? { scale: 0.95 } : {}}
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                'Analyze File'
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg"
        >
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;