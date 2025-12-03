#!/bin/bash

# Judge0 Self-Hosted Quick Start Script

echo "🚀 Starting Judge0 Self-Hosted Setup..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Navigate to judge0 directory
cd "$(dirname "$0")"

echo "📦 Pulling Docker images (this may take a few minutes)..."
docker compose pull

echo ""
echo "🔧 Starting Judge0 services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to initialize (30 seconds)..."
sleep 30

echo ""
echo "📊 Service status:"
docker compose ps

echo ""
echo "🧪 Testing Judge0 API..."
sleep 5

if curl -s http://localhost:2358/languages > /dev/null; then
    echo "✅ Judge0 is running successfully!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Your .env.local is already configured for self-hosted Judge0"
    echo "2. Restart your Next.js dev server: npm run dev"
    echo "3. Try submitting code in your app"
    echo ""
    echo "Useful commands:"
    echo "  - View logs: docker compose logs -f"
    echo "  - Stop services: docker compose down"
    echo "  - Restart: docker compose restart"
else
    echo "⚠️  Judge0 API is not responding yet. It may need more time to initialize."
    echo "Check logs with: docker compose logs -f"
fi
