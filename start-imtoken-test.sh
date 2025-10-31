#!/bin/bash

# StayFi - imToken Testing Setup Script
# This script exposes localhost to the internet for mobile testing

echo "🚀 Starting StayFi for imToken Testing..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Installing..."
    brew install ngrok/ngrok/ngrok
fi

# Kill existing processes
echo "🔄 Cleaning up existing processes..."
pkill -f "node server/self-verify-enhanced.js" 2>/dev/null
pkill -f "http-server" 2>/dev/null
pkill -f "ngrok" 2>/dev/null
sleep 2

# Start backend server
echo "✅ Starting backend server..."
node server/self-verify-enhanced.js > backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Check if backend started
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend running on http://localhost:3001"
else
    echo "❌ Backend failed to start. Check backend.log"
    exit 1
fi

# Start frontend server
echo "✅ Starting frontend server..."
npx http-server -p 8000 --cors > frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 2

# Check if frontend started
if curl -s -I http://localhost:8000/index.html > /dev/null; then
    echo "✅ Frontend running on http://localhost:8000"
else
    echo "❌ Frontend failed to start. Check frontend.log"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  IMPORTANT: Setting up ngrok tunnels..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 You need ngrok authtoken for this to work."
echo "   Visit: https://dashboard.ngrok.com/get-started/your-authtoken"
echo ""
read -p "Have you configured ngrok authtoken? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please run: ngrok config add-authtoken YOUR_TOKEN_HERE"
    echo "Then run this script again."
    exit 1
fi

# Start ngrok for backend (port 3001)
echo ""
echo "🌐 Starting ngrok tunnel for BACKEND (port 3001)..."
ngrok http 3001 --log=stdout > ngrok-backend.log 2>&1 &
NGROK_BACKEND_PID=$!
sleep 5

# Get backend ngrok URL
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Failed to get backend ngrok URL"
    echo "💡 Try running manually: ngrok http 3001"
    exit 1
fi

echo "✅ Backend exposed at: ${GREEN}${BACKEND_URL}${NC}"

# Start ngrok for frontend (port 8000) - different terminal needed
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  MANUAL STEP REQUIRED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Open a NEW terminal window and run:"
echo "${YELLOW}ngrok http 8000${NC}"
echo ""
echo "Then copy the HTTPS URL (like: https://xxxx.ngrok.io)"
echo ""
read -p "Enter the frontend ngrok URL: " FRONTEND_URL

# Validate URL
if [[ ! $FRONTEND_URL =~ ^https:// ]]; then
    echo "❌ Invalid URL. Must start with https://"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 ${GREEN}OPEN ON YOUR PHONE (imToken):${NC}"
echo "   ${BLUE}${FRONTEND_URL}/index.html${NC}"
echo ""
echo "🔗 Backend API:"
echo "   ${BACKEND_URL}/api/verify"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Configuration Update Needed:"
echo "   Update SELF_ENDPOINT in .env to:"
echo "   ${YELLOW}SELF_ENDPOINT=${BACKEND_URL}/api/verify${NC}"
echo ""
read -p "Update .env now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Backup .env
    cp .env .env.backup
    
    # Update SELF_ENDPOINT in .env
    if grep -q "^SELF_ENDPOINT=" .env; then
        sed -i '' "s|^SELF_ENDPOINT=.*|SELF_ENDPOINT=${BACKEND_URL}/api/verify|" .env
    else
        echo "SELF_ENDPOINT=${BACKEND_URL}/api/verify" >> .env
    fi
    
    echo "✅ .env updated (backup saved to .env.backup)"
    echo "🔄 Restarting backend with new config..."
    
    kill $BACKEND_PID 2>/dev/null
    sleep 2
    node server/self-verify-enhanced.js > backend.log 2>&1 &
    BACKEND_PID=$!
    sleep 3
    
    echo "✅ Backend restarted"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 ${GREEN}Testing Steps for imToken:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open imToken app on your phone"
echo "2. Go to DApp browser / 瀏覽器"
echo "3. Enter URL: ${BLUE}${FRONTEND_URL}/index.html${NC}"
echo "4. Connect wallet when prompted"
echo "5. Click 'Continue with Email'"
echo "6. Click '📱 驗證身份 / Verify Identity'"
echo "7. Complete verification"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Monitor logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo "   Ngrok:    tail -f ngrok-backend.log"
echo ""
echo "🛑 To stop all services:"
echo "   Press Ctrl+C or run: pkill -f ngrok; pkill -f http-server; pkill -f 'node server'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 ${GREEN}Ready for testing!${NC}"
echo ""

# Save URLs to file for reference
cat > ngrok-urls.txt << EOF
StayFi - imToken Testing URLs
Generated: $(date)

Frontend URL: ${FRONTEND_URL}/index.html
Backend URL:  ${BACKEND_URL}/api/verify

Open this URL on your phone:
${FRONTEND_URL}/index.html

Keep this terminal open to maintain the tunnels.
EOF

echo "📝 URLs saved to: ngrok-urls.txt"
echo ""

# Keep script running
echo "Press Ctrl+C to stop all services..."
wait
