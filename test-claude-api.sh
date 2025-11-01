#!/bin/bash

# NOTE: For security, use environment variable instead of hardcoding
# Set CLAUDE_API_KEY in your environment before running this script
CLAUDE_KEY="${CLAUDE_API_KEY:-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}"

echo "Testing Claude API key..."
echo "Key length: ${#CLAUDE_KEY}"

# Using latest stable Claude 3.5 Sonnet model
curl -X POST 'https://api.anthropic.com/v1/messages' \
  -H 'Content-Type: application/json' \
  -H "x-api-key: ${CLAUDE_KEY}" \
  -H 'anthropic-version: 2023-06-01' \
  -d '{
    "model": "claude-3-5-sonnet-20240620",
    "max_tokens": 50,
    "messages": [{"role": "user", "content": "Hello"}]
  }'