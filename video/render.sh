#!/bin/bash
cd ~/clawd-solana/hackathon/video
npx remotion render src/index.ts LegasiDemo out/legasi-demo.mp4 --frames=0-900 --codec h264 > /tmp/render.log 2>&1
echo "DONE" >> /tmp/render.log
