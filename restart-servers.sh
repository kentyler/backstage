#!/bin/bash

echo "Express React Restart Script (Bash)"
echo "==================================="

# Kill all node processes
echo -e "\nKilling all node processes..."
pkill -f node

# Give a moment for processes to terminate
echo -e "\nWaiting for processes to terminate..."
sleep 2

# Install backend dependencies if needed
echo -e "\nChecking backend dependencies..."
if [ ! -d "./backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd ./backend && npm install && cd ..
fi

# Install frontend dependencies if needed
echo -e "\nChecking frontend dependencies..."
if [ ! -d "./frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd ./frontend && npm install && cd ..
fi

# Start the Express backend server in a new terminal
echo -e "\nStarting Express backend server..."
cd ./backend
gnome-terminal --title="Backend Server" -- bash -c "npm start; exec bash" &
cd ..

# Give backend time to start
sleep 3

# Start the React frontend server in a new terminal  
echo -e "\nStarting React frontend server..."
cd ./frontend
gnome-terminal --title="Frontend Server" -- bash -c "npm start; exec bash" &
cd ..

echo -e "\nServers are starting!"
echo "- Backend Express server: http://localhost:5000"
echo "- Frontend React server: http://localhost:3000"
echo -e "\nServers are running in separate terminal windows."