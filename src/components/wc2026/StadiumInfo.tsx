'use client';

import { useMemo, useState } from 'react';
import { MATCHES, TEAMS, VENUES } from '@/lib/wc2026-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TeamFlag } from '@/components/wc2026/TeamFlag';
import { MapPin, Users, Tv, ChevronDown, ChevronUp, Globe } from 'lucide-react';

const toArabicDigits = (n: number | string): string => {
  return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};

// Country flags emoji
const COUNTRY_FLAGS: Record<string, string> = {
  'MX': '🇲🇽',
  'US': '🇺🇸',
  'CA': '🇨🇦',
};

// TV Channel mapping by round
const CHANNELS_BY_ROUND: Record<string, { name: string; nameAr: string }[]> = {
  'group': [
    { name: 'beIN Sports 1', nameAr: 'بي إن سبورت 1' },
    { name: 'beIN Sports 2', nameAr: 'بي إن سبورت 2' },
  ],
  'r32': [
    { name: 'beIN Sports 1', nameAr: 'بي إن سبورت 1' },
    { name: 'beIN Sports 2', nameAr: 'بي إن سبورت 2' },
    { name: 'SSC Sport', nameAr: 'إس إس سي سبورت' },
  ],
  'r16': [
    { name: 'beIN Sports 1', nameAr: 'بي إن سبورت 1' },
    { name: 'beIN Sports 2', nameAr: 'بي إن سبورت 2' },
    { name: 'SSC Sport', nameAr: 'إس إس سي سبورت' },
  ],
  'qf': [
    { name: 'beIN Sports 1', nameAr: 'بي إن سبورت 1' },
    { name: 'SSC Sport', nameAr: 'إس إس سي سبورت' },
  ],
  'sf': [
    { name: 'beIN Sports 1', nameAr: 'بي إن سبورت 1' },
    { name: 'SSC Sport', nameAr: 'إس إس سي سبورت' },
  ],
  '3rd': [
    { name: 'beIN Sports 1', nameAr: 'بي إن سبورت 1' },
  ],
  'final': [
    { name: 'beIN Sports 1', nameAr: 'بي إن سبورت 1' },
    { name: 'beIN Sports 2', nameAr: 'بي إن سبورت 2' },
    { name: 'SSC Sport', nameAr: 'إس إس سي سبورت' },
  ],
};

export function StadiumInfo() {
  const [expandedStadium, setExpandedStadium] = useState<string | null>(null);
  const [showChannels, setShowChannels] = useState(false);

  // Group matches by venue
  const matchesByVenue = useMemo(() => {
    const grouped: Record<string, typeof MATCHES> = {};
    for (const match of MATCHES) {
      if (!grouped[match.venue]) grouped[match.venue] = [];
      grouped[match.venue].push(match);
    }
    return grouped;
  }, []);

  // Group matches by round for channel info
  const matchesByRound = useMemo(() => {
    const grouped: Record<string, typeof MATCHES> = {};
    for (const match of MATCHES) {
      if (!grouped[match.round]) grouped[match.round] = [];
      grouped[match.round].push(match);
    }
    return grouped;
  }, []);

  const toggleStadium = (venueName: string) => {
    setExpandedStadium(prev => prev === venueName ? null : venueName);
  };

  return (
    <div className="space-y-6">
      {/* Stadium Cards */}
      <div className="space-y-3">
        {VENUES.map(venue => {
          const venueMatches = matchesByVenue[venue.name] || [];
          const isExpanded = expandedStadium === venue.name;
          const countryFlag = COUNTRY_FLAGS[venue.country] || '🏳️';

          return (
            <Card key={venue.name} className="overflow-hidden border-border/30 hover:shadow-md transition-shadow">
              <button
                onClick={() => toggleStadium(venue.name)}
                className="w-full text-right"
              >
                <div className="p-4 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-bl from-[#002868]/10 to-[#00A651]/10 flex items-center justify-center text-2xl flex-shrink-0">
                    🏟️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-[#002868] dark:text-blue-400 truncate">
                        {venue.nameAr}
                      </h3>
                      <span className="text-lg">{countryFlag}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{venue.name}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{venue.cityAr}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{toArabicDigits(venue.capacity.toLocaleString())} متفرج</span>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-[#00A651]/10 text-[#00A651]">
                        {toArabicDigits(venueMatches.length)} مباراة
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border/30 p-4 space-y-3">
                  {/* Venue Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-muted-foreground mb-1">المدينة</p>
                      <p className="font-bold">{venue.cityAr}</p>
                      <p className="text-muted-foreground">{venue.city}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-muted-foreground mb-1">السعة</p>
                      <p className="font-bold text-[#002868] dark:text-blue-400">{toArabicDigits(venue.capacity.toLocaleString())}</p>
                      <p className="text-muted-foreground">متفرج</p>
                    </div>
                  </div>

                  {/* Matches at this venue */}
                  <div>
                    <p className="text-xs font-bold text-[#002868] dark:text-blue-400 mb-2">المباريات في هذا الملعب</p>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {venueMatches.map(match => {
                        const team1 = TEAMS[match.team1];
                        const team2 = TEAMS[match.team2];
                        return (
                          <div
                            key={match.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                {toArabicDigits(match.id)}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <TeamFlag teamName={match.team1} size="sm" />
                                <span className="font-medium">{team1?.nameAr || match.team1}</span>
                              </div>
                              <span className="text-muted-foreground">ضد</span>
                              <div className="flex items-center gap-1">
                                <TeamFlag teamName={match.team2} size="sm" />
                                <span className="font-medium">{team2?.nameAr || match.team2}</span>
                              </div>
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {match.date}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* TV Channels Section */}
      <Card className="p-4 border-border/50">
        <button
          onClick={() => setShowChannels(!showChannels)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-[#E31837]" />
            <h3 className="text-sm font-bold text-[#002868] dark:text-blue-400">القنوات الناقلة</h3>
          </div>
          {showChannels ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showChannels && (
          <div className="mt-4 space-y-3">
            {/* Channel info */}
            <div className="p-3 rounded-lg bg-gradient-to-l from-[#002868]/5 to-[#E31837]/5 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-[#00A651]" />
                <p className="text-xs font-bold text-[#002868] dark:text-blue-400">القنوات العربية الناقلة</p>
              </div>
              <p className="text-xs text-muted-foreground">
                جميع المباريات مباشرة على شبكة beIN Sports وقنوات SSC Sport
              </p>
            </div>

            {/* Channels by round */}
            {Object.entries(CHANNELS_BY_ROUND).map(([round, channels]) => {
              const roundMatches = matchesByRound[round] || [];
              const roundNameAr: Record<string, string> = {
                'group': 'دور المجموعات',
                'r32': 'دور الـ 32',
                'r16': 'دور الـ 16',
                'qf': 'ربع النهائي',
                'sf': 'نصف النهائي',
                '3rd': 'المركز الثالث',
                'final': 'النهائي',
              };

              return (
                <div key={round} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#002868] dark:text-blue-400">{roundNameAr[round]}</span>
                    <Badge variant="outline" className="text-xs">
                      {toArabicDigits(roundMatches.length)} مباراة
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {channels.map(ch => (
                      <span
                        key={ch.name}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#002868]/10 text-[#002868] dark:text-blue-400 text-xs font-medium"
                      >
                        <Tv className="w-3 h-3" />
                        {ch.nameAr}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
