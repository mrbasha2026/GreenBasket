'use client';

import { TEAMS } from '@/lib/wc2026-data';

interface TeamFlagProps {
  teamName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TeamFlag({ teamName, size = 'md', className = '' }: TeamFlagProps) {
  const team = TEAMS[teamName];
  
  const sizeMap = {
    sm: { img: 'w-5 h-[14px]', text: 'text-xs' },
    md: { img: 'w-7 h-5', text: 'text-sm' },
    lg: { img: 'w-11 h-8', text: 'text-lg' },
  };

  const s = sizeMap[size];

  if (team?.flagCode) {
    return (
      <img
        src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${team.flagCode}.svg`}
        alt={team.nameAr || teamName}
        className={`${s.img} object-cover rounded-sm shadow-sm flex-shrink-0 ${className}`}
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.flag-fallback')) {
            const fallback = document.createElement('span');
            fallback.className = `${s.text} leading-none flag-fallback`;
            fallback.textContent = team.flag;
            parent.appendChild(fallback);
          }
        }}
      />
    );
  }

  if (team?.flag) {
    return <span className={`${s.text} leading-none flex-shrink-0 ${className}`}>{team.flag}</span>;
  }

  return <span className={`${s.text} leading-none flex-shrink-0 ${className}`}>⚽</span>;
}

interface TeamWithFlagProps {
  teamName: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
  nameClassName?: string;
  italic?: boolean;
}

export function TeamWithFlag({ 
  teamName, 
  size = 'md', 
  showName = true, 
  className = '',
  nameClassName = '',
  italic = false,
}: TeamWithFlagProps) {
  const team = TEAMS[teamName];
  const displayName = team?.nameAr || teamName;

  return (
    <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
      <TeamFlag teamName={teamName} size={size} />
      {showName && (
        <span className={`truncate font-medium ${italic ? 'text-muted-foreground italic' : ''} ${nameClassName}`}>
          {displayName}
        </span>
      )}
    </div>
  );
}
