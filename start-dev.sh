#!/bin/bash

# Start Development Servers Script
# Stops any existing servers, then starts both backend and frontend

echo "🚀 Starting development servers..."

# First, stop any existing servers
echo "🛑 Stopping any existing servers..."
pkill -f "npm start" 2>/dev/null
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null
sleep 2

# Start backend server in background
echo "📡 Starting backend server on port 5000..."
cd backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend server in background  
echo "🎨 Starting frontend server on port 3000..."
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to compile
echo "⏳ Waiting for servers to start..."
sleep 8

echo "✅ Servers started!"
echo "📡 Backend: http://localhost:5000 (PID: $BACKEND_PID)"
echo "🎨 Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "📋 To see backend logs: tail -f backend.log"
echo "📋 To see frontend logs: tail -f frontend.log"
echo "🛑 To stop servers: pkill -f npm"