#!/usr/bin/env bash

# Check if Dockerfile exists
if [ ! -f Dockerfile ]; then
    echo "❌ Dockerfile not found in current directory!"
    exit 1
fi

echo "🐳 Building Docker image for ademola-xd..."
docker build -t ademola-xd .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo "📋 Image details:"
    docker images | grep ademola-xd
else
    echo "❌ Docker build failed!"
    exit 1
fi