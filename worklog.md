---
Task ID: 1
Agent: Main
Task: Fix notifications, add live matches page, remove leaderboard, fix countdown flags

Work Log:
- Fixed CountdownTimer.tsx to use TeamFlag component instead of emoji flags for country display in next match countdown
- Removed SIMULATED_LEADERBOARD and leaderboard section from PredictionGame.tsx
- Created new LiveMatches.tsx component with:
  - Current Saudi time display (updates every second)
  - Today's matches based on Saudi timezone with live/upcoming/finished status
  - Next 6 upcoming matches with time-until countdown
  - Visual indicators (red pulse for live, gold for upcoming, green for finished)
- Added "🔴 اليوم" tab as first tab in page.tsx navigation
- Integrated LiveMatches component into the new tab
- Notification system already supports auto-all mode (schedules all matches when enabled)
- Build verified successfully

Stage Summary:
- CountdownTimer now uses TeamFlag SVG flags instead of emoji
- Leaderboard completely removed from PredictionGame
- New "اليوم" (Today) tab shows live/current matches with Saudi time
- All 4 tasks completed successfully
- Build passes with no errors
