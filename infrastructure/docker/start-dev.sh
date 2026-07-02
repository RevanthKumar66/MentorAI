#!/bin/bash
# ============================================================
# Momentum AI — Docker Development Startup Script
# ============================================================
# Usage: bash infrastructure/docker/start-dev.sh
# ============================================================

set -e

COMPOSE_FILE="infrastructure/docker/docker-compose.dev.yml"
OLLAMA_MODEL="${OLLAMA_MODEL:-mistral}"   # Default: Mistral 7B

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Momentum AI — Docker Dev Environment   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

echo "🚀 Starting all services..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo ""
echo "⏳ Waiting for Ollama to be ready..."
until docker exec mentorai-ollama ollama list > /dev/null 2>&1; do
  sleep 2
done

echo ""
echo "📦 Pulling Ollama model: $OLLAMA_MODEL"
echo "   (This may take a few minutes on first run — model is cached for future starts)"
docker exec mentorai-ollama ollama pull "$OLLAMA_MODEL"

echo ""
echo "✅ All services running!"
echo ""
echo "  🌐 Web App  → http://localhost:3000"
echo "  🔌 API      → http://localhost:8000"
echo "  📖 API Docs → http://localhost:8000/docs"
echo "  🤖 Ollama   → http://localhost:11434"
echo ""
echo "  💡 To use local Ollama models instead of HuggingFace:"
echo "     Set LLM_PROVIDER=ollama in services/api/.env"
echo "     Then restart: docker compose -f $COMPOSE_FILE restart api"
echo ""
echo "  📋 To view logs:"
echo "     docker compose -f $COMPOSE_FILE logs -f api"
echo ""
echo "  🛑 To stop all services:"
echo "     docker compose -f $COMPOSE_FILE down"
echo ""
