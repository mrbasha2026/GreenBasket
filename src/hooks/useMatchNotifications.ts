'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MATCHES, TEAMS } from '@/lib/wc2026-data';

const NOTIF_ENABLED_KEY = 'wc2026-notif-enabled';
const NOTIF_BEFORE_MINUTES = 5; // Notify 5 minutes before match start

// Get venue timezone offset
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

function getUTCDate(date: string, time: string, venue: string): Date | null {
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

export function useMatchNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const scheduledRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const initializedRef = useRef(false);

  // Load notification preference from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(NOTIF_ENABLED_KEY);
      if (stored === 'true') {
        setNotificationsEnabled(true);
      }
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    } catch {
      // ignore
    }
  }, []);

  // Format UTC time to Arabic-friendly Saudi time
  const formatTimeAr = useCallback((utcDate: Date): string => {
    try {
      const hourStr = utcDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Riyadh',
      });
      const match12 = hourStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (match12) {
        const hours = parseInt(match12[1]);
        const minutes = match12[2];
        const isPM = match12[3].toUpperCase() === 'PM';
        const period = isPM ? 'م' : 'ص';
        const toArabicDigits = (n: string | number) => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
        return `${toArabicDigits(hours)}:${toArabicDigits(minutes)} ${period}`;
      }
      return hourStr;
    } catch {
      return '';
    }
  }, []);

  // Show browser notification
  const showNotification = useCallback((title: string, body: string, matchId: number) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/wc2026-icon-192.png',
        badge: '/wc2026-favicon.png',
        tag: `match-${matchId}`,
        dir: 'rtl',
        lang: 'ar',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      // Fallback: try service worker notification
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body,
            icon: '/wc2026-icon-192.png',
            badge: '/wc2026-favicon.png',
            tag: `match-${matchId}`,
            dir: 'rtl',
            lang: 'ar',
          });
        });
      }
    }
  }, []);

  // Schedule a notification for a match
  const scheduleNotification = useCallback((matchId: number) => {
    const match = MATCHES.find(m => m.id === matchId);
    if (!match || !match.time) return;

    const utcDate = getUTCDate(match.date, match.time, match.venue);
    if (!utcDate) return;

    const team1Name = TEAMS[match.team1]?.nameAr || match.team1;
    const team2Name = TEAMS[match.team2]?.nameAr || match.team2;

    const now = new Date();
    const matchTime = utcDate.getTime();
    const beforeTime = matchTime - NOTIF_BEFORE_MINUTES * 60 * 1000;

    // Clear any existing scheduled notification for this match
    const existingBefore = scheduledRef.current.get(matchId);
    const existingStart = scheduledRef.current.get(matchId * 10000 + matchId);
    if (existingBefore) { clearTimeout(existingBefore); scheduledRef.current.delete(matchId); }
    if (existingStart) { clearTimeout(existingStart); scheduledRef.current.delete(matchId * 10000 + matchId); }

    // Schedule "5 minutes before" notification
    if (beforeTime > now.getTime()) {
      const beforeDelay = beforeTime - now.getTime();
      const beforeTimer = setTimeout(() => {
        showNotification(
          `⏰ مباراة ${team1Name} ضد ${team2Name} ستبدأ بعد ${NOTIF_BEFORE_MINUTES} دقائق`,
          `المباراة ستبدأ الساعة ${formatTimeAr(utcDate)} في ${match.venueAr}`,
          matchId
        );
      }, beforeDelay);
      scheduledRef.current.set(matchId, beforeTimer);
    }

    // Schedule "match started" notification
    if (matchTime > now.getTime()) {
      const startDelay = matchTime - now.getTime();
      const startTimer = setTimeout(() => {
        showNotification(
          `⚽ بدأت المباراة! ${team1Name} ضد ${team2Name}`,
          `المباراة جارية الآن في ${match.venueAr}`,
          matchId
        );
      }, startDelay);
      scheduledRef.current.set(matchId * 10000 + matchId, startTimer);
    }
  }, [showNotification, formatTimeAr]);

  // Schedule ALL upcoming matches
  const scheduleAllUpcoming = useCallback(() => {
    const now = new Date();
    for (const match of MATCHES) {
      if (!match.time) continue;
      const utcDate = getUTCDate(match.date, match.time, match.venue);
      if (!utcDate) continue;
      // Only schedule if match hasn't started yet
      if (utcDate.getTime() > now.getTime()) {
        scheduleNotification(match.id);
      }
    }
  }, [scheduleNotification]);

  // Clear all scheduled notifications
  const clearAllScheduled = useCallback(() => {
    for (const timer of scheduledRef.current.values()) {
      clearTimeout(timer);
    }
    scheduledRef.current.clear();
  }, []);

  // Request notification permission and enable auto-notifications
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'denied') {
      setPermission('denied');
      return false;
    }

    if (Notification.permission !== 'granted') {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return false;
    }

    setPermission('granted');
    setNotificationsEnabled(true);
    localStorage.setItem(NOTIF_ENABLED_KEY, 'true');
    scheduleAllUpcoming();
    return true;
  }, [scheduleAllUpcoming]);

  // Disable notifications
  const disableNotifications = useCallback(() => {
    setNotificationsEnabled(false);
    localStorage.setItem(NOTIF_ENABLED_KEY, 'false');
    clearAllScheduled();
  }, [clearAllScheduled]);

  // On mount: if notifications were previously enabled and permission is still granted, reschedule all
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (typeof window === 'undefined') return;

    const wasEnabled = localStorage.getItem(NOTIF_ENABLED_KEY) === 'true';
    const hasPermission = 'Notification' in window && Notification.permission === 'granted';

    if (wasEnabled && hasPermission) {
      setNotificationsEnabled(true);
      setPermission('granted');
      scheduleAllUpcoming();
    } else if (wasEnabled && !hasPermission) {
      // Permission was revoked
      setNotificationsEnabled(false);
      localStorage.setItem(NOTIF_ENABLED_KEY, 'false');
    }
  }, [scheduleAllUpcoming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllScheduled();
    };
  }, [clearAllScheduled]);

  // Count upcoming matches
  const upcomingCount = MATCHES.filter(m => {
    if (!m.time) return false;
    const utcDate = getUTCDate(m.date, m.time, m.venue);
    return utcDate && utcDate.getTime() > Date.now();
  }).length;

  return {
    permission,
    notificationsEnabled,
    upcomingCount,
    requestPermission,
    disableNotifications,
  };
}
