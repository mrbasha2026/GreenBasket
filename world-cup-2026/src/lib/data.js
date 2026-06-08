// 2026 FIFA World Cup - 48 Teams, 12 Groups, 104 Matches

export const teams = [
  // Group A
  { id: 'usa', name: 'الولايات المتحدة', nameEn: 'USA', flag: 'us' },
  { id: 'mex', name: 'المكسيك', nameEn: 'Mexico', flag: 'mx' },
  { id: 'can', name: 'كندا', nameEn: 'Canada', flag: 'ca' },
  { id: 'crc', name: 'كوستاريكا', nameEn: 'Costa Rica', flag: 'cr' },
  // Group B
  { id: 'bra', name: 'البرازيل', nameEn: 'Brazil', flag: 'br' },
  { id: 'ger', name: 'ألمانيا', nameEn: 'Germany', flag: 'de' },
  { id: 'cmr', name: 'الكاميرون', nameEn: 'Cameroon', flag: 'cm' },
  { id: 'hon', name: 'هندوراس', nameEn: 'Honduras', flag: 'hn' },
  // Group C
  { id: 'arg', name: 'الأرجنتين', nameEn: 'Argentina', flag: 'ar' },
  { id: 'esp', name: 'إسبانيا', nameEn: 'Spain', flag: 'es' },
  { id: 'nga', name: 'نيجيريا', nameEn: 'Nigeria', flag: 'ng' },
  { id: 'uzb', name: 'أوزبكستان', nameEn: 'Uzbekistan', flag: 'uz' },
  // Group D
  { id: 'fra', name: 'فرنسا', nameEn: 'France', flag: 'fr' },
  { id: 'eng', name: 'إنجلترا', nameEn: 'England', flag: 'gb-eng' },
  { id: 'chi', name: 'تشيلي', nameEn: 'Chile', flag: 'cl' },
  { id: 'sud', name: 'السودان', nameEn: 'Sudan', flag: 'sd' },
  // Group E
  { id: 'por', name: 'البرتغال', nameEn: 'Portugal', flag: 'pt' },
  { id: 'ned', name: 'هولندا', nameEn: 'Netherlands', flag: 'nl' },
  { id: 'rsa', name: 'جنوب أفريقيا', nameEn: 'South Africa', flag: 'za' },
  { id: 'ksa', name: 'السعودية', nameEn: 'Saudi Arabia', flag: 'sa' },
  // Group F
  { id: 'bel', name: 'بلجيكا', nameEn: 'Belgium', flag: 'be' },
  { id: 'cro', name: 'كرواتيا', nameEn: 'Croatia', flag: 'hr' },
  { id: 'ecu', name: 'الإكوادور', nameEn: 'Ecuador', flag: 'ec' },
  { id: 'irn', name: 'إيران', nameEn: 'Iran', flag: 'ir' },
  // Group G
  { id: 'ita', name: 'إيطاليا', nameEn: 'Italy', flag: 'it' },
  { id: 'col', name: 'كولومبيا', nameEn: 'Colombia', flag: 'co' },
  { id: 'mar', name: 'المغرب', nameEn: 'Morocco', flag: 'ma' },
  { id: 'tun', name: 'تونس', nameEn: 'Tunisia', flag: 'tn' },
  // Group H
  { id: 'uru', name: 'الأوروغواي', nameEn: 'Uruguay', flag: 'uy' },
  { id: 'sui', name: 'سويسرا', nameEn: 'Switzerland', flag: 'ch' },
  { id: 'gha', name: 'غانا', nameEn: 'Ghana', flag: 'gh' },
  { id: 'prk', name: 'كوريا الشمالية', nameEn: 'North Korea', flag: 'kp' },
  // Group I
  { id: 'den', name: 'الدنمارك', nameEn: 'Denmark', flag: 'dk' },
  { id: 'aus', name: 'أستراليا', nameEn: 'Australia', flag: 'au' },
  { id: 'jpn', name: 'اليابان', nameEn: 'Japan', flag: 'jp' },
  { id: 'chn', name: 'الصين', nameEn: 'China', flag: 'cn' },
  // Group J
  { id: 'kor', name: 'كوريا الجنوبية', nameEn: 'South Korea', flag: 'kr' },
  { id: 'swe', name: 'السويد', nameEn: 'Sweden', flag: 'se' },
  { id: 'par', name: 'باراغواي', nameEn: 'Paraguay', flag: 'py' },
  { id: 'civ', name: 'ساحل العاج', nameEn: 'Ivory Coast', flag: 'ci' },
  // Group K
  { id: 'pol', name: 'بولندا', nameEn: 'Poland', flag: 'pl' },
  { id: 'ser', name: 'صربيا', nameEn: 'Serbia', flag: 'rs' },
  { id: 'sen', name: 'السنغال', nameEn: 'Senegal', flag: 'sn' },
  { id: 'per', name: 'بيرو', nameEn: 'Peru', flag: 'pe' },
  // Group L
  { id: 'ukr', name: 'أوكرانيا', nameEn: 'Ukraine', flag: 'ua' },
  { id: 'tur', name: 'تركيا', nameEn: 'Turkey', flag: 'tr' },
  { id: 'mli', name: 'مالي', nameEn: 'Mali', flag: 'ml' },
  { id: 'pan', name: 'بنما', nameEn: 'Panama', flag: 'pa' },
];

export const groups = [
  { id: 'A', name: 'المجموعة A', teams: ['usa', 'mex', 'can', 'crc'] },
  { id: 'B', name: 'المجموعة B', teams: ['bra', 'ger', 'cmr', 'hon'] },
  { id: 'C', name: 'المجموعة C', teams: ['arg', 'esp', 'nga', 'uzb'] },
  { id: 'D', name: 'المجموعة D', teams: ['fra', 'eng', 'chi', 'sud'] },
  { id: 'E', name: 'المجموعة E', teams: ['por', 'ned', 'rsa', 'ksa'] },
  { id: 'F', name: 'المجموعة F', teams: ['bel', 'cro', 'ecu', 'irn'] },
  { id: 'G', name: 'المجموعة G', teams: ['ita', 'col', 'mar', 'tun'] },
  { id: 'H', name: 'المجموعة H', teams: ['uru', 'sui', 'gha', 'prk'] },
  { id: 'I', name: 'المجموعة I', teams: ['den', 'aus', 'jpn', 'chn'] },
  { id: 'J', name: 'المجموعة J', teams: ['kor', 'swe', 'par', 'civ'] },
  { id: 'K', name: 'المجموعة K', teams: ['pol', 'ser', 'sen', 'per'] },
  { id: 'L', name: 'المجموعة L', teams: ['ukr', 'tur', 'mli', 'pan'] },
];

// Helper to get team by id
export function getTeam(id) {
  return teams.find(t => t.id === id);
}

// Group stage matches - 3 matches per group pairing = 72 matches
// Each group: 4 teams, 6 pairings = 6 matches per group, 12 groups = 72 matches
function generateGroupMatches() {
  const matches = [];
  let matchNum = 1;

  groups.forEach(group => {
    const t = group.teams;
    // 6 pairings per group
    const pairings = [
      [t[0], t[1]], // 1st vs 2nd
      [t[2], t[3]], // 3rd vs 4th
      [t[0], t[2]], // 1st vs 3rd
      [t[1], t[3]], // 2nd vs 4th
      [t[0], t[3]], // 1st vs 4th
      [t[1], t[2]], // 2nd vs 3rd
    ];

    pairings.forEach(([home, away]) => {
      matches.push({
        id: matchNum,
        type: 'group',
        group: group.id,
        home,
        away,
        homeScore: null,
        awayScore: null,
        homePenalty: null,
        awayPenalty: null,
      });
      matchNum++;
    });
  });

  return matches;
}

// Knockout stage matches - 32 matches
// R32: 16 matches (73-88)
// R16: 8 matches (89-96)
// QF: 4 matches (97-100)
// SF: 2 matches (101-102)
// Final: 1 match (103)
// Third Place: 1 match (104)
function generateKnockoutMatches() {
  const matches = [];
  let matchNum = 73;

  // Round of 32 - 16 matches
  // Top 2 from each group (24 teams) + 8 best 3rd place teams
  // Positions: 1A,2A,1B,2B,...,1L,2L + best 3rd place
  const r32 = [
    // Match 73: 1A vs 2B
    { home: '1A', away: '2B' },
    // Match 74: 1C vs 2D
    { home: '1C', away: '2D' },
    // Match 75: 1E vs 2F
    { home: '1E', away: '2F' },
    // Match 76: 1G vs 2H
    { home: '1G', away: '2H' },
    // Match 77: 1I vs 2J
    { home: '1I', away: '2J' },
    // Match 78: 1K vs 2L
    { home: '1K', away: '2L' },
    // Match 79: 1B vs 2A
    { home: '1B', away: '2A' },
    // Match 80: 1D vs 2C
    { home: '1D', away: '2C' },
    // Match 81: 1F vs 2E
    { home: '1F', away: '2E' },
    // Match 82: 1H vs 2G
    { home: '1H', away: '2G' },
    // Match 83: 1J vs 2I
    { home: '1J', away: '2I' },
    // Match 84: 1L vs 2K
    { home: '1L', away: '2K' },
    // Match 85: Best 3rd ABD vs Best 3rd CEF
    { home: '3ABD', away: '3CEF' },
    // Match 86: Best 3rd GHI vs Best 3rd JKL
    { home: '3GHI', away: '3JKL' },
    // Match 87: Best 3rd ABC vs Best 3rd DEF
    { home: '3ABC', away: '3DEF' },
    // Match 88: Best 3rd GHI vs Best 3rd JKL2
    { home: '3GHI2', away: '3JKL2' },
  ];

  r32.forEach(m => {
    matches.push({
      id: matchNum,
      type: 'r32',
      group: null,
      home: m.home,
      away: m.away,
      homeScore: null,
      awayScore: null,
      homePenalty: null,
      awayPenalty: null,
    });
    matchNum++;
  });

  // Round of 16 - 8 matches (89-96)
  const r16 = [
    { home: 'W73', away: 'W86' },  // 89
    { home: 'W74', away: 'W85' },  // 90
    { home: 'W75', away: 'W88' },  // 91
    { home: 'W76', away: 'W87' },  // 92
    { home: 'W77', away: 'W84' },  // 93
    { home: 'W78', away: 'W83' },  // 94
    { home: 'W79', away: 'W82' },  // 95
    { home: 'W80', away: 'W81' },  // 96
  ];

  r16.forEach(m => {
    matches.push({
      id: matchNum,
      type: 'r16',
      group: null,
      home: m.home,
      away: m.away,
      homeScore: null,
      awayScore: null,
      homePenalty: null,
      awayPenalty: null,
    });
    matchNum++;
  });

  // Quarter Finals - 4 matches (97-100)
  const qf = [
    { home: 'W89', away: 'W90' },  // 97
    { home: 'W91', away: 'W92' },  // 98
    { home: 'W93', away: 'W94' },  // 99
    { home: 'W95', away: 'W96' },  // 100
  ];

  qf.forEach(m => {
    matches.push({
      id: matchNum,
      type: 'qf',
      group: null,
      home: m.home,
      away: m.away,
      homeScore: null,
      awayScore: null,
      homePenalty: null,
      awayPenalty: null,
    });
    matchNum++;
  });

  // Semi Finals - 2 matches (101-102)
  const sf = [
    { home: 'W97', away: 'W98' },  // 101
    { home: 'W99', away: 'W100' }, // 102
  ];

  sf.forEach(m => {
    matches.push({
      id: matchNum,
      type: 'sf',
      group: null,
      home: m.home,
      away: m.away,
      homeScore: null,
      awayScore: null,
      homePenalty: null,
      awayPenalty: null,
    });
    matchNum++;
  });

  // Final - match 103
  matches.push({
    id: 103,
    type: 'final',
    group: null,
    home: 'W101',
    away: 'W102',
    homeScore: null,
    awayScore: null,
    homePenalty: null,
    awayPenalty: null,
  });

  // Third Place - match 104
  matches.push({
    id: 104,
    type: 'third',
    group: null,
    home: 'L101',
    away: 'L102',
    homeScore: null,
    awayScore: null,
    homePenalty: null,
    awayPenalty: null,
  });

  return matches;
}

export const allMatches = [...generateGroupMatches(), ...generateKnockoutMatches()];

// Knockout bracket structure for display
export const knockoutRounds = {
  r32: {
    name: 'دور الـ 32',
    nameShort: 'R32',
    matchIds: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88],
  },
  r16: {
    name: 'دور الـ 16',
    nameShort: 'R16',
    matchIds: [89, 90, 91, 92, 93, 94, 95, 96],
  },
  qf: {
    name: 'ربع النهائي',
    nameShort: 'QF',
    matchIds: [97, 98, 99, 100],
  },
  sf: {
    name: 'نصف النهائي',
    nameShort: 'SF',
    matchIds: [101, 102],
  },
  final: {
    name: 'النهائي',
    nameShort: 'Final',
    matchIds: [103],
  },
  third: {
    name: 'المركز الثالث',
    nameShort: '3rd',
    matchIds: [104],
  },
};

// Stage names in Arabic
export const stageNames = {
  group: 'دور المجموعات',
  r32: 'دور الـ 32',
  r16: 'دور الـ 16',
  qf: 'ربع النهائي',
  sf: 'نصف النهائي',
  final: 'النهائي',
  third: 'المركز الثالث',
};
