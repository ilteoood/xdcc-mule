#!/bin/bash

# Simple test script to verify the Rust server functionality

echo "Testing XDCC Mule Rust Server..."

# Test if server is responding
echo "1. Testing server health..."
curl -s http://localhost:3001/api/files 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Server is responding"
else
    echo "❌ Server not responding on port 3001"
    echo "Make sure to set DATABASE_URL and run: cargo run"
    exit 1
fi

# Test files endpoint with search
echo "2. Testing file search..."
response=$(curl -s "http://localhost:3001/api/files?name=test")
if [ $? -eq 0 ]; then
    echo "✅ File search endpoint working"
    echo "Response: $response"
else
    echo "❌ File search endpoint failed"
fi

# Test downloads endpoint
echo "3. Testing downloads endpoint..."
response=$(curl -s "http://localhost:3001/api/downloads")
if [ $? -eq 0 ]; then
    echo "✅ Downloads endpoint working"
    echo "Response: $response"
else
    echo "❌ Downloads endpoint failed"
fi

echo "✅ Basic server tests completed!"
