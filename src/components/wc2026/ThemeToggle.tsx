'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/50 text-muted-foreground"
        aria-label="تبديل المظهر"
      >
        <Sun className="w-4 h-4" />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
      title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      aria-label={isDark ? 'تبديل إلى الوضع الفاتح' : 'تبديل إلى الوضع الداكن'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#FFD700]" />
      ) : (
        <Moon className="w-4 h-4 text-[#002868]" />
      )}
    </button>
  );
}
