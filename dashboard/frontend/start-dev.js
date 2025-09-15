const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting NetFlow Classifier Development Environment...\n');

// Start backend server
console.log('📡 Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Start frontend development server
console.log('🎨 Starting frontend development server...');
const frontend = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

backend.on('close', (code) => {
  console.log(`Backend server exited with code ${code}`);
});

frontend.on('close', (code) => {
  console.log(`Frontend server exited with code ${code}`);
});