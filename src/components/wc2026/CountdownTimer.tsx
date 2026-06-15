'use client';

import { useState, useEffect, useMemo } from 'react';
import { MATCHES, TEAMS } from '@/lib/wc2026-data';
import { Clock } from 'lucide-react';

// Arabic-Indic digits
const toArabicDigits = (n: number | string): string => {
  return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};

// Venue timezone offsets (hours behind UTC, negative = ahead)
const VENUE_TZ_OFFSETS: Record<string, number> = {
  'Mexico City Stadium': -5,
  'Estadio Guadalajara': -5,
  'Estadio Monterrey': -5,
  'Boston Stadium': -4,
  'New York New Jersey Stadium': -4,
  'Philadelphia Stadium': -4,
  'Miami Stadium': -4,
  'Atlanta Stadium': -4,
  'Houston Stadium': -5,
  'Dallas Stadium': -5,
  'Kansas City Stadium': -5,
  'Los Angeles Stadium': -7,
  'San Francisco Bay Area Stadium': -7,
  'Seattle Stadium': -7,
  'Toronto Stadium': -4,
  'BC Place Vancouver': -7,
};

function getMatchUTCDate(date: string, time: string, venue: string): Date | null {
  const venueOffset = VENUE_TZ_OFFSETS[venue];
  if (venueOffset === undefined) return null;
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const utcHours = hours - venueOffset;
    return new Date(Date.UTC(
      parseInt(date.substring(0, 4)),
      parseInt(date.substring(5, 7)) - 1,
      parseInt(date.substring(8, 10)),
      utcHours,
      minutes,
      0
    ));
  } catch {
    return null;
  }
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date().getTime();
  const diff = targetDate.getTime() - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [nextMatchTimeLeft, setNextMatchTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [nextMatch, setNextMatch] = useState<typeof MATCHES[0] | null>(null);

  // Tournament start: June 11, 2026 - match id 1, Mexico vs South Africa at 14:00 local (UTC-5) = 19:00 UTC
  const tournamentStart = useMemo(() => new Date('2026-06-11T19:00:00Z'), []);

  // Find the next upcoming match
  const upcomingMatch = useMemo(() => {
    const now = new Date();
    let next: typeof MATCHES[0] | null = null;
    let nextUTC: Date | null = null;

    for (const match of MATCHES) {
      if (!match.time) continue;
      const utcDate = getMatchUTCDate(match.date, match.time, match.venue);
      if (utcDate && utcDate > now) {
        if (!nextUTC || utcDate < nextUTC) {
          next = match;
          nextUTC = utcDate;
        }
      }
    }
    return { match: next, utcDate: nextUTC };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(tournamentStart));

      if (upcomingMatch.utcDate) {
        setNextMatchTimeLeft(calculateTimeLeft(upcomingMatch.utcDate));
      }
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft(tournamentStart));
    if (upcomingMatch.utcDate) {
      setNextMatchTimeLeft(calculateTimeLeft(upcomingMatch.utcDate));
    }
    setNextMatch(upcomingMatch.match);

    return () => clearInterval(timer);
  }, [tournamentStart, upcomingMatch]);

  const tournamentStarted = timeLeft.total <= 0;
  const nextMatchStarted = nextMatchTimeLeft.total <= 0;

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[56px] border border-white/10">
        <p className="text-[#FFD700] text-2xl md:text-3xl font-bold tabular-nums">
          {toArabicDigits(String(value).padStart(2, '0'))}
        </p>
      </div>
      <p className="text-white/60 text-xs mt-1 font-medium">{label}</p>
    </div>
  );

  const Separator = () => (
    <span className="text-[#FFD700]/50 text-2xl md:text-3xl font-bold self-start mt-2">:</span>
  );

  return (
    <div className="mt-8 space-y-4">
      {/* Main Tournament Countdown */}
      <div className="bg-gradient-to-l from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-[#FFD700]" />
          <h3 className="text-white font-bold text-sm">
            {tournamentStarted ? 'البطولة بدأت! 🏆' : 'العد التنازلي لكأس العالم 2026'}
          </h3>
        </div>

        {tournamentStarted ? (
          <div className="text-center">
            <p className="text-[#FFD700] text-3xl font-extrabold animate-pulse">
              البطولة بدأت! 🏆
            </p>
            <p className="text-white/70 text-sm mt-2">
              تابع المباريات والنتائج مباشرة
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 md:gap-3">
            <TimeBox value={timeLeft.days} label="أيام" />
            <Separator />
            <TimeBox value={timeLeft.hours} label="ساعات" />
            <Separator />
            <TimeBox value={timeLeft.minutes} label="دقائق" />
            <Separator />
            <TimeBox value={timeLeft.seconds} label="ثوانٍ" />
          </div>
        )}
      </div>

      {/* Next Upcoming Match Countdown */}
      {nextMatch && !nextMatchStarted && (
        <div className="bg-gradient-to-l from-[#00A651]/20 to-[#00A651]/5 backdrop-blur-sm rounded-xl p-4 border border-[#00A651]/20">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[#00A651] text-sm">⚽</span>
            <h4 className="text-white/80 font-bold text-xs">المباراة القادمة</h4>
          </div>

          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{TEAMS[nextMatch.team1]?.flag || '🏳️'}</span>
              <span className="text-white text-sm font-bold">
                {TEAMS[nextMatch.team1]?.nameAr || nextMatch.team1}
              </span>
            </div>
            <span className="text-[#FFD700] text-xs font-bold">ضد</span>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-bold">
                {TEAMS[nextMatch.team2]?.nameAr || nextMatch.team2}
              </span>
              <span className="text-lg">{TEAMS[nextMatch.team2]?.flag || '🏳️'}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 md:gap-3">
            <TimeBox value={nextMatchTimeLeft.days} label="أيام" />
            <Separator />
            <TimeBox value={nextMatchTimeLeft.hours} label="ساعات" />
            <Separator />
            <TimeBox value={nextMatchTimeLeft.minutes} label="دقائق" />
            <Separator />
            <TimeBox value={nextMatchTimeLeft.seconds} label="ثوانٍ" />
          </div>
        </div>
      )}
    </div>
  );
}
