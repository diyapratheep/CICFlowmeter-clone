// API service for backend communication
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
  }

  // Live capture endpoints
  async startLiveCapture(config) {
    const response = await fetch(`${this.baseURL}/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    return response.json();
  }

  async stopLiveCapture(sessionId) {
    const response = await fetch(`${this.baseURL}/sessions/${sessionId}/stop`, {
      method: 'POST',
    });
    return response.json();
  }

  async getLiveFlows(sessionId, lastNSeconds = null) {
    const params = new URLSearchParams();
    if (lastNSeconds) {
      params.append('lastNSeconds', lastNSeconds);
    }
    
    const response = await fetch(
      `${this.baseURL}/flows/${sessionId}?${params}`
    );
    return response.json();
  }

  // File upload endpoints
  async uploadPcapFile(file) {
    const formData = new FormData();
    formData.append('pcap', file);

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  async getUploadAnalysis(uploadId) {
    const response = await fetch(`${this.baseURL}/analysis/${uploadId}`);
    return response.json();
  }

  // History endpoints
  async getSessionHistory() {
    const response = await fetch(`${this.baseURL}/history`);
    return response.json();
  }

  async deleteSession(sessionId) {
    const response = await fetch(`${this.baseURL}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  async downloadSession(sessionId) {
    const response = await fetch(`${this.baseURL}/sessions/${sessionId}/download`);
    return response.blob();
  }
}

export const apiService = new ApiService();
export default apiService;