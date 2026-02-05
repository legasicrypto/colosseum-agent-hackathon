#!/bin/bash
cd ~/clawd-solana/hackathon/video
npx remotion render src/index.ts LegasiDemo out/legasi-full.mp4 --codec h264 2>&1 | tee /tmp/render-full.log
echo "DONE" >> /tmp/render-full.log
