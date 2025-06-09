#!/bin/bash

# Start Development Servers Script
# Starts backend on port 5000 and frontend on port 3000, then opens browser

echo "🚀 Starting development servers..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start backend server
echo "📡 Starting backend server on port 5000..."
cd backend
npm start &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend server
echo "🎨 Starting frontend server on port 3000..."
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to compile
echo "⏳ Waiting for frontend to compile..."
sleep 8

# Check if frontend is running
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo "❌ Frontend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Open browser (try different commands based on system)
echo "🌐 Opening browser..."
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000
elif command -v open > /dev/null; then
    open http://localhost:3000
elif command -v start > /dev/null; then
    start http://localhost:3000
else
    echo "✅ Servers are running!"
    echo "📡 Backend: http://localhost:5000"
    echo "🎨 Frontend: http://localhost:3000"
    echo "🌐 Open http://localhost:3000 in your browser"
fi

echo ""
echo "✅ Development environment is ready!"
echo "📡 Backend running on port 5000 (PID: $BACKEND_PID)"
echo "🎨 Frontend running on port 3000 (PID: $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Keep script running and wait for user to stop
wait