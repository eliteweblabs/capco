#!/bin/bash

echo "🎤 Voice Assistant Setup"
echo "======================"
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
    else
        echo "⚠️  .env.example not found. Creating basic .env file..."
        cat > .env << EOF
# Voice Assistant Configuration
WAKE_WORD=hey assistant
ENABLE_SPEECH_RESPONSE=true
VOICE=Alex

# Required: Anthropic API Key (get from https://console.anthropic.com)
ANTHROPIC_API_KEY=

# Required: Supabase Configuration
PUBLIC_SUPABASE_URL=
SUPABASE_SECRET=
EOF
        echo "✅ Created basic .env file"
    fi
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add:"
    echo "   - ANTHROPIC_API_KEY (required for AI responses)"
    echo "   - PUBLIC_SUPABASE_URL (required for learning tables)"
    echo "   - SUPABASE_SECRET or PUBLIC_SUPABASE_PUBLISHABLE (required for learning tables)"
else
    echo "✅ .env file already exists"
fi

# Create models directory
if [ ! -d models ]; then
    echo ""
    echo "Creating models directory..."
    mkdir -p models
    echo "✅ Created models directory"
    echo ""
    echo "📥 To enable offline speech recognition, download a Vosk model:"
    echo "   1. Visit: https://alphacephei.com/vosk/models"
    echo "   2. Download: vosk-model-small-en-us-0.15"
    echo "   3. Extract to: ./models/vosk-model-small-en-us-0.15/"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the assistant, run: npm start"
echo ""

