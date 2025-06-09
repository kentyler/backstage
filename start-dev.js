#!/usr/bin/env node

// Node.js script to start both development servers and open browser
// Cross-platform solution

const { spawn } = require('child_process');
const path = require('path');
const open = require('open');

console.log('🚀 Starting development servers...');

let backendProcess;
let frontendProcess;

// Cleanup function
function cleanup() {
    console.log('\n🛑 Stopping servers...');
    if (backendProcess) backendProcess.kill();
    if (frontendProcess) frontendProcess.kill();
    process.exit(0);
}

// Handle Ctrl+C
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function startServers() {
    try {
        // Start backend server
        console.log('📡 Starting backend server on port 5000...');
        backendProcess = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'backend'),
            stdio: ['inherit', 'pipe', 'pipe'],
            shell: true
        });

        backendProcess.stdout.on('data', (data) => {
            console.log(`[Backend] ${data}`);
        });

        backendProcess.stderr.on('data', (data) => {
            console.error(`[Backend Error] ${data}`);
        });

        // Wait for backend to start
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Start frontend server
        console.log('🎨 Starting frontend server on port 3000...');
        frontendProcess = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'frontend'),
            stdio: ['inherit', 'pipe', 'pipe'],
            shell: true
        });

        frontendProcess.stdout.on('data', (data) => {
            console.log(`[Frontend] ${data}`);
        });

        frontendProcess.stderr.on('data', (data) => {
            console.error(`[Frontend Error] ${data}`);
        });

        // Wait for frontend to compile
        console.log('⏳ Waiting for frontend to compile...');
        await new Promise(resolve => setTimeout(resolve, 8000));

        // Open browser
        console.log('🌐 Opening browser...');
        try {
            await open('http://localhost:3000');
        } catch (error) {
            console.log('Could not automatically open browser. Please open http://localhost:3000 manually');
        }

        console.log('');
        console.log('✅ Development environment is ready!');
        console.log('📡 Backend running on port 5000');
        console.log('🎨 Frontend running on port 3000');
        console.log('');
        console.log('Press Ctrl+C to stop both servers');

        // Keep the script running
        process.stdin.resume();

    } catch (error) {
        console.error('❌ Error starting servers:', error);
        cleanup();
    }
}

startServers();