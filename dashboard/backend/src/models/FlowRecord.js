// FlowRecord model - Represents a network flow record

class FlowRecord {
  constructor(data) {
    // Basic flow information
    this.id = data.FlowID || data.id;
    this.srcIP = data.SrcIP || data.srcIP;
    this.dstIP = data.DstIP || data.dstIP;
    this.srcPort = data.SrcPort || data.srcPort;
    this.dstPort = data.DstPort || data.dstPort;
    this.protocol = data.Protocol || data.protocol;
    
    // Flow metrics
    this.duration = data.FlowDuration || data.duration || 0;
    this.totalBytes = data.TotalBytes || data.totalBytes || 0;
    this.totalPackets = data.TotalPackets || data.totalPackets || 0;
    this.bytesPerSec = data.BytesPerSec || data.bytesPerSec || 0;
    this.packetsPerSec = data.PktsPerSec || data.packetsPerSec || 0;
    
    // Forward direction
    this.fwdPackets = data.TotFwdPkts || data.fwdPackets || 0;
    this.fwdBytes = data.TotLenFwd || data.fwdBytes || 0;
    
    // Backward direction
    this.bwdPackets = data.TotBwdPkts || data.bwdPackets || 0;
    this.bwdBytes = data.TotLenBwd || data.bwdBytes || 0;
    
    // Classification result
    this.prediction = data.Prediction || data.prediction || 'Unknown';
    this.confidence = data.Confidence || data.confidence || 0;
    
    // Timestamp
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  // Get flow direction based on source/destination
  getDirection() {
    // Simple heuristic: if source port > destination port, likely outbound
    return this.srcPort > this.dstPort ? 'outbound' : 'inbound';
  }

  // Check if flow is suspicious based on classification
  isSuspicious() {
    return this.prediction === 'Malicious';
  }

  // Get flow category color for UI
  getCategoryColor() {
    switch (this.prediction) {
      case 'Web':
        return '#22c55e'; // Green
      case 'Multimedia':
        return '#3b82f6'; // Blue
      case 'Social Media':
        return '#fbbf24'; // Yellow
      case 'Malicious':
        return '#ef4444'; // Red
      default:
        return '#8b5cf6'; // Purple
    }
  }

  // Format bytes for display
  formatBytes() {
    const bytes = this.totalBytes;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Format duration for display
  formatDuration() {
    const seconds = this.duration;
    if (seconds < 60) {
      return `${seconds.toFixed(2)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = (seconds % 60).toFixed(0);
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  // Convert to JSON for API responses
  toJSON() {
    return {
      id: this.id,
      srcIP: this.srcIP,
      dstIP: this.dstIP,
      srcPort: this.srcPort,
      dstPort: this.dstPort,
      protocol: this.protocol,
      duration: this.duration,
      totalBytes: this.totalBytes,
      totalPackets: this.totalPackets,
      bytesPerSec: this.bytesPerSec,
      packetsPerSec: this.packetsPerSec,
      fwdPackets: this.fwdPackets,
      fwdBytes: this.fwdBytes,
      bwdPackets: this.bwdPackets,
      bwdBytes: this.bwdBytes,
      prediction: this.prediction,
      confidence: this.confidence,
      timestamp: this.timestamp,
      direction: this.getDirection(),
      isSuspicious: this.isSuspicious(),
      categoryColor: this.getCategoryColor(),
      formattedBytes: this.formatBytes(),
      formattedDuration: this.formatDuration()
    };
  }
}

module.exports = FlowRecord;