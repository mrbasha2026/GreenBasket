#!/bin/bash
cd /home/z/my-project
while true; do
  bun .next/standalone/server.js 2>&1 | tee -a /home/z/my-project/server.log
  echo "Server died at $(date). Restarting in 3s..." >> /home/z/my-project/server.log
  sleep 3
done
