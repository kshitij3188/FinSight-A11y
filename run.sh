#!/bin/bash
# bunq Guide — start server
set -e

if [ ! -f .env ]; then
  echo "ERROR: .env file missing. Copy .env.example and add your ANTHROPIC_API_KEY."
  exit 1
fi

if [ ! -d chroma_db ]; then
  echo "ChromaDB not found. Running RAG ingestion first..."
  python rag/ingest.py
fi

echo ""
echo "Starting bunq Guide server..."
echo "Open: http://localhost:8000"
echo ""
uvicorn app:app --reload --host 0.0.0.0 --port 8000
