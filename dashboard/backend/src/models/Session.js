// Session model - In-memory storage for now
// You can replace this with a database model later

class Session {
  constructor(id, config = {}) {
    this.id = id;
    this.config = config;
    this.status = 'created';
    this.startTime = new Date();
    this.endTime = null;
    this.flowCount = 0;
    this.lastUpdate = new Date();
  }

  start() {
    this.status = 'running';
    this.startTime = new Date();
    this.lastUpdate = new Date();
  }

  stop() {
    this.status = 'stopped';
    this.endTime = new Date();
    this.lastUpdate = new Date();
  }

  updateFlowCount(count) {
    this.flowCount = count;
    this.lastUpdate = new Date();
  }

  getDuration() {
    const endTime = this.endTime || new Date();
    return Math.floor((endTime - this.startTime) / 1000); // Duration in seconds
  }

  toJSON() {
    return {
      id: this.id,
      config: this.config,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      flowCount: this.flowCount,
      duration: this.getDuration(),
      lastUpdate: this.lastUpdate
    };
  }
}

module.exports = Session;