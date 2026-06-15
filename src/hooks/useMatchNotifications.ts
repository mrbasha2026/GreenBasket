'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MATCHES, TEAMS } from '@/lib/wc2026-data';

const NOTIF_ENABLED_KEY = 'wc2026-notif-enabled';
const NOTIF_BEFORE_MINUTES = 5;

const VENUE_TZ_OFFSETS: Record<string, number> = {
  'Mexico City Stadium': -5, 'Estadio Guadalajara': -5, 'Estadio Monterrey': -5,
  'Boston Stadium': -4, 'New York New Jersey Stadium': -4, 'Philadelphia Stadium': -4,
  'Miami Stadium': -4, 'Atlanta Stadium': -4, 'Houston Stadium': -5, 'Dallas Stadium': -5,
  'Kansas City Stadium': -5, 'Los Angeles Stadium': -7, 'San Francisco Bay Area Stadium': -7,
  'Seattle Stadium': -7, 'Toronto Stadium': -4, 'BC Place Vancouver': -7,
};

function getUTCDate(date: string, time: string, venue: string): Date | null {
  const venueOffset = VENUE_TZ_OFFSETS[venue];
  if (venueOffset === undefined) return null;
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const utcHours = hours - venueOffset;
    return new Date(Date.UTC(parseInt(date.substring(0, 4)), parseInt(date.substring(5, 7)) - 1, parseInt(date.substring(8, 10)), utcHours, minutes, 0));
  } catch { return null; }
}

export function useMatchNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const scheduledRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const initializedRef = useRef(false);

  // Load and auto-request on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('Notification' in window) {
      setPermission(Notification.permission);

      // Auto-enable: if permission is already granted, enable automatically
      if (Notification.permission === 'granted') {
        const wasEnabled = localStorage.getItem(NOTIF_ENABLED_KEY);
        // Auto-enable on first visit or if previously enabled
        if (wasEnabled !== 'false') {
          setNotificationsEnabled(true);
          localStorage.setItem(NOTIF_ENABLED_KEY, 'true');
        }
      }
    }
  }, []);

  // Auto-request notification permission on first visit
  useEffect(() => {
    if (initializedRef.current) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    initializedRef.current = true;

    const wasEnabled = localStorage.getItem(NOTIF_ENABLED_KEY);
    const perm = Notification.permission;

    // If previously enabled and permission still granted, reschedule
    if (wasEnabled === 'true' && perm === 'granted') {
      setNotificationsEnabled(true);
      setPermission('granted');
      scheduleAllUpcoming();
    }
    // If first visit (never set) or was enabled, auto-request permission
    else if (wasEnabled === null && perm === 'default') {
      // Auto-request after a short delay to avoid blocking initial render
      setTimeout(async () => {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') {
          setNotificationsEnabled(true);
          localStorage.setItem(NOTIF_ENABLED_KEY, 'true');
          scheduleAllUpcoming();
        }
      }, 2000);
    }
  }, []);

  const formatTimeAr = useCallback((utcDate: Date): string => {
    try {
      const hourStr = utcDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Riyadh' });
      const match12 = hourStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (match12) {
        const hours = parseInt(match12[1]);
        const minutes = match12[2];
        const isPM = match12[3].toUpperCase() === 'PM';
        const period = isPM ? 'م' : 'ص';
        const toAr = (n: string | number) => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
        return `${toAr(hours)}:${toAr(minutes)} ${period}`;
      }
      return hourStr;
    } catch { return ''; }
  }, []);

  const showNotification = useCallback((title: string, body: string, matchId: number) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const notif = new Notification(title, {
        body,
        icon: '/wc2026-icon-192.png',
        badge: '/wc2026-favicon.png',
        tag: `match-${matchId}`,
        dir: 'rtl',
        lang: 'ar',
      });
      notif.onclick = () => { window.focus(); notif.close(); };
    } catch {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, { body, icon: '/wc2026-icon-192.png', tag: `match-${matchId}`, dir: 'rtl', lang: 'ar' });
        });
      }
    }
  }, []);

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

    // Clear existing
    const existingBefore = scheduledRef.current.get(matchId);
    const existingStart = scheduledRef.current.get(matchId * 10000 + matchId);
    if (existingBefore) { clearTimeout(existingBefore); scheduledRef.current.delete(matchId); }
    if (existingStart) { clearTimeout(existingStart); scheduledRef.current.delete(matchId * 10000 + matchId); }

    // Schedule "5 minutes before" notification
    if (beforeTime > now.getTime()) {
      const beforeTimer = setTimeout(() => {
        showNotification(
          `⏰ مباراة ${team1Name} ضد ${team2Name} ستبدأ بعد ٥ دقائق`,
          `المباراة ستبدأ الساعة ${formatTimeAr(utcDate)} في ${match.venueAr}`,
          matchId
        );
      }, beforeTime - now.getTime());
      scheduledRef.current.set(matchId, beforeTimer);
    }

    // Schedule "match started" notification
    if (matchTime > now.getTime()) {
      const startTimer = setTimeout(() => {
        showNotification(
          `⚽ بدأت المباراة! ${team1Name} ضد ${team2Name}`,
          `المباراة جارية الآن في ${match.venueAr}`,
          matchId * 10000 + matchId
        );
      }, matchTime - now.getTime());
      scheduledRef.current.set(matchId * 10000 + matchId, startTimer);
    }
  }, [showNotification, formatTimeAr]);

  const scheduleAllUpcoming = useCallback(() => {
    const now = new Date();
    for (const match of MATCHES) {
      if (!match.time) continue;
      const utcDate = getUTCDate(match.date, match.time, match.venue);
      if (utcDate && utcDate.getTime() > now.getTime()) {
        scheduleNotification(match.id);
      }
    }
  }, [scheduleNotification]);

  const clearAllScheduled = useCallback(() => {
    for (const timer of scheduledRef.current.values()) clearTimeout(timer);
    scheduledRef.current.clear();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'denied') { setPermission('denied'); return false; }
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

  const disableNotifications = useCallback(() => {
    setNotificationsEnabled(false);
    localStorage.setItem(NOTIF_ENABLED_KEY, 'false');
    clearAllScheduled();
  }, [clearAllScheduled]);

  // Re-schedule on enable change
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      scheduleAllUpcoming();
    }
    return () => { clearAllScheduled(); };
  }, [notificationsEnabled, scheduleAllUpcoming, clearAllScheduled]);

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
