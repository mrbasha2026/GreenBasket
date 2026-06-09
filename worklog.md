---
Task ID: 1
Agent: Main Agent
Task: Fix World Cup 2026 site - server crash, trophy image, PWA support

Work Log:
- Identified root cause: the old dev server was stuck (549min CPU, 1.7GB RAM) causing the site to appear broken
- Killed stuck processes and restarted fresh dev server
- Fixed trophy image: replaced massive base64 data URI in trophy-image.ts with simple path reference "/wc2026-trophy.png"
- Created PWA icons (192x192 and 512x512) using sharp from the logo
- Updated manifest.json with proper icon sizes for PWA install support
- Rebuilt project successfully - all static files generated correctly
- Verified server responds with HTTP 200 and correct content (183KB HTML)

Stage Summary:
- Trophy image now loads from /wc2026-trophy.png instead of inline base64 (much smaller, faster)
- PWA support enhanced with proper icons at 192x192 and 512x512
- Dev server running on port 3000 and responding correctly
- All static assets accessible: logo, trophy, favicon, manifest, service worker
- Site content verified: Arabic text, team flags, match cards all rendering correctly
