#!/bin/bash

# Script to start all Kafka services
# Usage: ./start-all.sh

echo "Starting all Kafka services..."

# Function to start a service in background
start_service() {
    local service_name=$1
    local service_dir=$2
    
    echo "Starting $service_name..."
    cd "$service_dir"
    npm start &
    local pid=$!
    echo "$service_name started with PID: $pid"
    cd ..
}

# Start all services
start_service "business-registered" "business-registered"
start_service "search-logs" "search-logs" 
start_service "send-email" "send-email"

echo "All services started!"
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
