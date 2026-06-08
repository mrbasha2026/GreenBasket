// FIFA World Cup 2026 Tournament Data
// 48 teams, 12 groups (A-L), 104 total matches

export interface Team {
  name: string;
  nameAr: string;
  flag: string; // emoji flag (fallback)
  flagCode: string; // ISO 3166-1 alpha-2 code for SVG flag
  group: string;
}

export interface Match {
  id: number;
  date: string;
  team1: string; // team name key
  team2: string; // team name key
  group?: string; // only for group stage
  venue: string;
  venueAr: string;
  round: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | '3rd' | 'final';
  // For knockout matches, team1/team2 can be references
  team1Ref?: string; // e.g., "1A" = winner group A, "2A" = runner-up, "3ABC" = best 3rd from groups A/B/C
  team2Ref?: string;
}

export interface GroupStanding {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

// Team data with Arabic names and flags
export const TEAMS: Record<string, Team> = {
  'Mexico': { name: 'Mexico', nameAr: 'المكسيك', flag: '🇲🇽', flagCode: 'mx', group: 'A' },
  'South Africa': { name: 'South Africa', nameAr: 'جنوب أفريقيا', flag: '🇿🇦', flagCode: 'za', group: 'A' },
  'Korea Republic': { name: 'Korea Republic', nameAr: 'كوريا الجنوبية', flag: '🇰🇷', flagCode: 'kr', group: 'A' },
  'Czechia': { name: 'Czechia', nameAr: 'التشيك', flag: '🇨🇿', flagCode: 'cz', group: 'A' },
  'Canada': { name: 'Canada', nameAr: 'كندا', flag: '🇨🇦', flagCode: 'ca', group: 'B' },
  'Switzerland': { name: 'Switzerland', nameAr: 'سويسرا', flag: '🇨🇭', flagCode: 'ch', group: 'B' },
  'Qatar': { name: 'Qatar', nameAr: 'قطر', flag: '🇶🇦', flagCode: 'qa', group: 'B' },
  'Bosnia and Herzegovina': { name: 'Bosnia and Herzegovina', nameAr: 'البوسنة والهرسك', flag: '🇧🇦', flagCode: 'ba', group: 'B' },
  'Brazil': { name: 'Brazil', nameAr: 'البرازيل', flag: '🇧🇷', flagCode: 'br', group: 'C' },
  'Morocco': { name: 'Morocco', nameAr: 'المغرب', flag: '🇲🇦', flagCode: 'ma', group: 'C' },
  'Haiti': { name: 'Haiti', nameAr: 'هايتي', flag: '🇭🇹', flagCode: 'ht', group: 'C' },
  'Scotland': { name: 'Scotland', nameAr: 'اسكتلندا', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', flagCode: 'gb-sct', group: 'C' },
  'United States': { name: 'United States', nameAr: 'الولايات المتحدة', flag: '🇺🇸', flagCode: 'us', group: 'D' },
  'Paraguay': { name: 'Paraguay', nameAr: 'باراغواي', flag: '🇵🇾', flagCode: 'py', group: 'D' },
  'Australia': { name: 'Australia', nameAr: 'أستراليا', flag: '🇦🇺', flagCode: 'au', group: 'D' },
  'Türkiye': { name: 'Türkiye', nameAr: 'تركيا', flag: '🇹🇷', flagCode: 'tr', group: 'D' },
  'Germany': { name: 'Germany', nameAr: 'ألمانيا', flag: '🇩🇪', flagCode: 'de', group: 'E' },
  'Curaçao': { name: 'Curaçao', nameAr: 'كوراساو', flag: '🇨🇼', flagCode: 'cw', group: 'E' },
  'Côte d\'Ivoire': { name: 'Côte d\'Ivoire', nameAr: 'ساحل العاج', flag: '🇨🇮', flagCode: 'ci', group: 'E' },
  'Ecuador': { name: 'Ecuador', nameAr: 'الإكوادور', flag: '🇪🇨', flagCode: 'ec', group: 'E' },
  'Netherlands': { name: 'Netherlands', nameAr: 'هولندا', flag: '🇳🇱', flagCode: 'nl', group: 'F' },
  'Japan': { name: 'Japan', nameAr: 'اليابان', flag: '🇯🇵', flagCode: 'jp', group: 'F' },
  'Tunisia': { name: 'Tunisia', nameAr: 'تونس', flag: '🇹🇳', flagCode: 'tn', group: 'F' },
  'Sweden': { name: 'Sweden', nameAr: 'السويد', flag: '🇸🇪', flagCode: 'se', group: 'F' },
  'Belgium': { name: 'Belgium', nameAr: 'بلجيكا', flag: '🇧🇪', flagCode: 'be', group: 'G' },
  'Egypt': { name: 'Egypt', nameAr: 'مصر', flag: '🇪🇬', flagCode: 'eg', group: 'G' },
  'IR Iran': { name: 'IR Iran', nameAr: 'إيران', flag: '🇮🇷', flagCode: 'ir', group: 'G' },
  'New Zealand': { name: 'New Zealand', nameAr: 'نيوزيلندا', flag: '🇳🇿', flagCode: 'nz', group: 'G' },
  'Spain': { name: 'Spain', nameAr: 'إسبانيا', flag: '🇪🇸', flagCode: 'es', group: 'H' },
  'Cabo Verde': { name: 'Cabo Verde', nameAr: 'الرأس الأخضر', flag: '🇨🇻', flagCode: 'cv', group: 'H' },
  'Saudi Arabia': { name: 'Saudi Arabia', nameAr: 'السعودية', flag: '🇸🇦', flagCode: 'sa', group: 'H' },
  'Uruguay': { name: 'Uruguay', nameAr: 'الأوروغواي', flag: '🇺🇾', flagCode: 'uy', group: 'H' },
  'France': { name: 'France', nameAr: 'فرنسا', flag: '🇫🇷', flagCode: 'fr', group: 'I' },
  'Senegal': { name: 'Senegal', nameAr: 'السنغال', flag: '🇸🇳', flagCode: 'sn', group: 'I' },
  'Norway': { name: 'Norway', nameAr: 'النرويج', flag: '🇳🇴', flagCode: 'no', group: 'I' },
  'Iraq': { name: 'Iraq', nameAr: 'العراق', flag: '🇮🇶', flagCode: 'iq', group: 'I' },
  'Argentina': { name: 'Argentina', nameAr: 'الأرجنتين', flag: '🇦🇷', flagCode: 'ar', group: 'J' },
  'Algeria': { name: 'Algeria', nameAr: 'الجزائر', flag: '🇩🇿', flagCode: 'dz', group: 'J' },
  'Austria': { name: 'Austria', nameAr: 'النمسا', flag: '🇦🇹', flagCode: 'at', group: 'J' },
  'Jordan': { name: 'Jordan', nameAr: 'الأردن', flag: '🇯🇴', flagCode: 'jo', group: 'J' },
  'Portugal': { name: 'Portugal', nameAr: 'البرتغال', flag: '🇵🇹', flagCode: 'pt', group: 'K' },
  'Uzbekistan': { name: 'Uzbekistan', nameAr: 'أوزبكستان', flag: '🇺🇿', flagCode: 'uz', group: 'K' },
  'Colombia': { name: 'Colombia', nameAr: 'كولومبيا', flag: '🇨🇴', flagCode: 'co', group: 'K' },
  'Congo DR': { name: 'Congo DR', nameAr: 'الكونغو الديمقراطية', flag: '🇨🇩', flagCode: 'cd', group: 'K' },
  'England': { name: 'England', nameAr: 'إنجلترا', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagCode: 'gb-eng', group: 'L' },
  'Croatia': { name: 'Croatia', nameAr: 'كرواتيا', flag: '🇭🇷', flagCode: 'hr', group: 'L' },
  'Ghana': { name: 'Ghana', nameAr: 'غانا', flag: '🇬🇭', flagCode: 'gh', group: 'L' },
  'Panama': { name: 'Panama', nameAr: 'بنما', flag: '🇵🇦', flagCode: 'pa', group: 'L' },
};

export const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;

export const GROUP_NAMES_AR: Record<string, string> = {
  'A': 'المجموعة أ',
  'B': 'المجموعة ب',
  'C': 'المجموعة ج',
  'D': 'المجموعة د',
  'E': 'المجموعة هـ',
  'F': 'المجموعة و',
  'G': 'المجموعة ز',
  'H': 'المجموعة ح',
  'I': 'المجموعة ط',
  'J': 'المجموعة ي',
  'K': 'المجموعة ك',
  'L': 'المجموعة ل',
};

export const ROUND_NAMES_AR: Record<string, string> = {
  'group': 'دور المجموعات',
  'r32': 'دور الـ 32',
  'r16': 'دور الـ 16',
  'qf': 'ربع النهائي',
  'sf': 'نصف النهائي',
  '3rd': 'مباراة المركز الثالث',
  'final': 'النهائي',
};

export const getTeamsInGroup = (group: string): string[] => {
  return Object.values(TEAMS)
    .filter(t => t.group === group)
    .map(t => t.name);
};

// All 104 matches
export const MATCHES: Match[] = [
  // GROUP STAGE - Matchday 1
  { id: 1, date: '2026-06-11', team1: 'Mexico', team2: 'South Africa', group: 'A', venue: 'Mexico City Stadium', venueAr: 'ملعب مكسيكو سيتي', round: 'group' },
  { id: 2, date: '2026-06-11', team1: 'Korea Republic', team2: 'Czechia', group: 'A', venue: 'Estadio Guadalajara', venueAr: 'ملعب غوادالاخارا', round: 'group' },
  { id: 3, date: '2026-06-12', team1: 'Canada', team2: 'Bosnia and Herzegovina', group: 'B', venue: 'Toronto Stadium', venueAr: 'ملعب تورنتو', round: 'group' },
  { id: 4, date: '2026-06-12', team1: 'United States', team2: 'Paraguay', group: 'D', venue: 'Los Angeles Stadium', venueAr: 'ملعب لوس أنجلوس', round: 'group' },
  { id: 5, date: '2026-06-13', team1: 'Haiti', team2: 'Scotland', group: 'C', venue: 'Boston Stadium', venueAr: 'ملعب بوسطن', round: 'group' },
  { id: 6, date: '2026-06-13', team1: 'Australia', team2: 'Türkiye', group: 'D', venue: 'BC Place Vancouver', venueAr: 'ملعب فانكوفر', round: 'group' },
  { id: 7, date: '2026-06-13', team1: 'Brazil', team2: 'Morocco', group: 'C', venue: 'New York New Jersey Stadium', venueAr: 'ملعب نيويورك نيو جيرسي', round: 'group' },
  { id: 8, date: '2026-06-13', team1: 'Qatar', team2: 'Switzerland', group: 'B', venue: 'San Francisco Bay Area Stadium', venueAr: 'ملعب سان فرانسيسكو', round: 'group' },
  { id: 9, date: '2026-06-14', team1: 'Côte d\'Ivoire', team2: 'Ecuador', group: 'E', venue: 'Philadelphia Stadium', venueAr: 'ملعب فيلادلفيا', round: 'group' },
  { id: 10, date: '2026-06-14', team1: 'Germany', team2: 'Curaçao', group: 'E', venue: 'Houston Stadium', venueAr: 'ملعب هيوستن', round: 'group' },
  { id: 11, date: '2026-06-14', team1: 'Netherlands', team2: 'Japan', group: 'F', venue: 'Dallas Stadium', venueAr: 'ملعب دالاس', round: 'group' },
  { id: 12, date: '2026-06-14', team1: 'Sweden', team2: 'Tunisia', group: 'F', venue: 'Estadio Monterrey', venueAr: 'ملعب مونتيري', round: 'group' },
  { id: 13, date: '2026-06-15', team1: 'Saudi Arabia', team2: 'Uruguay', group: 'H', venue: 'Miami Stadium', venueAr: 'ملعب ميامي', round: 'group' },
  { id: 14, date: '2026-06-15', team1: 'Spain', team2: 'Cabo Verde', group: 'H', venue: 'Atlanta Stadium', venueAr: 'ملعب أتلانتا', round: 'group' },
  { id: 15, date: '2026-06-15', team1: 'IR Iran', team2: 'New Zealand', group: 'G', venue: 'Los Angeles Stadium', venueAr: 'ملعب لوس أنجلوس', round: 'group' },
  { id: 16, date: '2026-06-15', team1: 'Belgium', team2: 'Egypt', group: 'G', venue: 'Seattle Stadium', venueAr: 'ملعب سياتل', round: 'group' },
  { id: 17, date: '2026-06-16', team1: 'France', team2: 'Senegal', group: 'I', venue: 'New York New Jersey Stadium', venueAr: 'ملعب نيويورك نيو جيرسي', round: 'group' },
  { id: 18, date: '2026-06-16', team1: 'Iraq', team2: 'Norway', group: 'I', venue: 'Boston Stadium', venueAr: 'ملعب بوسطن', round: 'group' },
  { id: 19, date: '2026-06-16', team1: 'Argentina', team2: 'Algeria', group: 'J', venue: 'Kansas City Stadium', venueAr: 'ملعب كانساس سيتي', round: 'group' },
  { id: 20, date: '2026-06-16', team1: 'Austria', team2: 'Jordan', group: 'J', venue: 'San Francisco Bay Area Stadium', venueAr: 'ملعب سان فرانسيسكو', round: 'group' },
  { id: 21, date: '2026-06-17', team1: 'Ghana', team2: 'Panama', group: 'L', venue: 'Toronto Stadium', venueAr: 'ملعب تورنتو', round: 'group' },
  { id: 22, date: '2026-06-17', team1: 'England', team2: 'Croatia', group: 'L', venue: 'Dallas Stadium', venueAr: 'ملعب دالاس', round: 'group' },
  { id: 23, date: '2026-06-17', team1: 'Portugal', team2: 'Congo DR', group: 'K', venue: 'Houston Stadium', venueAr: 'ملعب هيوستن', round: 'group' },
  { id: 24, date: '2026-06-17', team1: 'Uzbekistan', team2: 'Colombia', group: 'K', venue: 'Mexico City Stadium', venueAr: 'ملعب مكسيكو سيتي', round: 'group' },

  // GROUP STAGE - Matchday 2
  { id: 25, date: '2026-06-18', team1: 'Czechia', team2: 'South Africa', group: 'A', venue: 'Atlanta Stadium', venueAr: 'ملعب أتلانتا', round: 'group' },
  { id: 26, date: '2026-06-18', team1: 'Switzerland', team2: 'Bosnia and Herzegovina', group: 'B', venue: 'Los Angeles Stadium', venueAr: 'ملعب لوس أنجلوس', round: 'group' },
  { id: 27, date: '2026-06-18', team1: 'Canada', team2: 'Qatar', group: 'B', venue: 'BC Place Vancouver', venueAr: 'ملعب فانكوفر', round: 'group' },
  { id: 28, date: '2026-06-18', team1: 'Mexico', team2: 'Korea Republic', group: 'A', venue: 'Estadio Guadalajara', venueAr: 'ملعب غوادالاخارا', round: 'group' },
  { id: 29, date: '2026-06-19', team1: 'Brazil', team2: 'Haiti', group: 'C', venue: 'Philadelphia Stadium', venueAr: 'ملعب فيلادلفيا', round: 'group' },
  { id: 30, date: '2026-06-19', team1: 'Scotland', team2: 'Morocco', group: 'C', venue: 'Boston Stadium', venueAr: 'ملعب بوسطن', round: 'group' },
  { id: 31, date: '2026-06-19', team1: 'Türkiye', team2: 'Paraguay', group: 'D', venue: 'San Francisco Bay Area Stadium', venueAr: 'ملعب سان فرانسيسكو', round: 'group' },
  { id: 32, date: '2026-06-19', team1: 'United States', team2: 'Australia', group: 'D', venue: 'Seattle Stadium', venueAr: 'ملعب سياتل', round: 'group' },
  { id: 33, date: '2026-06-20', team1: 'Germany', team2: 'Côte d\'Ivoire', group: 'E', venue: 'Toronto Stadium', venueAr: 'ملعب تورنتو', round: 'group' },
  { id: 34, date: '2026-06-20', team1: 'Ecuador', team2: 'Curaçao', group: 'E', venue: 'Kansas City Stadium', venueAr: 'ملعب كانساس سيتي', round: 'group' },
  { id: 35, date: '2026-06-20', team1: 'Netherlands', team2: 'Sweden', group: 'F', venue: 'Houston Stadium', venueAr: 'ملعب هيوستن', round: 'group' },
  { id: 36, date: '2026-06-20', team1: 'Tunisia', team2: 'Japan', group: 'F', venue: 'Estadio Monterrey', venueAr: 'ملعب مونتيري', round: 'group' },
  { id: 37, date: '2026-06-21', team1: 'Uruguay', team2: 'Cabo Verde', group: 'H', venue: 'Miami Stadium', venueAr: 'ملعب ميامي', round: 'group' },
  { id: 38, date: '2026-06-21', team1: 'Spain', team2: 'Saudi Arabia', group: 'H', venue: 'Atlanta Stadium', venueAr: 'ملعب أتلانتا', round: 'group' },
  { id: 39, date: '2026-06-21', team1: 'Belgium', team2: 'IR Iran', group: 'G', venue: 'Los Angeles Stadium', venueAr: 'ملعب لوس أنجلوس', round: 'group' },
  { id: 40, date: '2026-06-21', team1: 'New Zealand', team2: 'Egypt', group: 'G', venue: 'BC Place Vancouver', venueAr: 'ملعب فانكوفر', round: 'group' },
  { id: 41, date: '2026-06-22', team1: 'Norway', team2: 'Senegal', group: 'I', venue: 'New York New Jersey Stadium', venueAr: 'ملعب نيويورك نيو جيرسي', round: 'group' },
  { id: 42, date: '2026-06-22', team1: 'France', team2: 'Iraq', group: 'I', venue: 'Philadelphia Stadium', venueAr: 'ملعب فيلادلفيا', round: 'group' },
  { id: 43, date: '2026-06-22', team1: 'Argentina', team2: 'Austria', group: 'J', venue: 'Dallas Stadium', venueAr: 'ملعب دالاس', round: 'group' },
  { id: 44, date: '2026-06-22', team1: 'Jordan', team2: 'Algeria', group: 'J', venue: 'San Francisco Bay Area Stadium', venueAr: 'ملعب سان فرانسيسكو', round: 'group' },
  { id: 45, date: '2026-06-23', team1: 'England', team2: 'Ghana', group: 'L', venue: 'Boston Stadium', venueAr: 'ملعب بوسطن', round: 'group' },
  { id: 46, date: '2026-06-23', team1: 'Panama', team2: 'Croatia', group: 'L', venue: 'Toronto Stadium', venueAr: 'ملعب تورنتو', round: 'group' },
  { id: 47, date: '2026-06-23', team1: 'Portugal', team2: 'Uzbekistan', group: 'K', venue: 'Houston Stadium', venueAr: 'ملعب هيوستن', round: 'group' },
  { id: 48, date: '2026-06-23', team1: 'Colombia', team2: 'Congo DR', group: 'K', venue: 'Estadio Guadalajara', venueAr: 'ملعب غوادالاخارا', round: 'group' },

  // GROUP STAGE - Matchday 3
  { id: 49, date: '2026-06-24', team1: 'Scotland', team2: 'Brazil', group: 'C', venue: 'Miami Stadium', venueAr: 'ملعب ميامي', round: 'group' },
  { id: 50, date: '2026-06-24', team1: 'Morocco', team2: 'Haiti', group: 'C', venue: 'Atlanta Stadium', venueAr: 'ملعب أتلانتا', round: 'group' },
  { id: 51, date: '2026-06-24', team1: 'Switzerland', team2: 'Canada', group: 'B', venue: 'BC Place Vancouver', venueAr: 'ملعب فانكوفر', round: 'group' },
  { id: 52, date: '2026-06-24', team1: 'Bosnia and Herzegovina', team2: 'Qatar', group: 'B', venue: 'Seattle Stadium', venueAr: 'ملعب سياتل', round: 'group' },
  { id: 53, date: '2026-06-24', team1: 'Czechia', team2: 'Mexico', group: 'A', venue: 'Mexico City Stadium', venueAr: 'ملعب مكسيكو سيتي', round: 'group' },
  { id: 54, date: '2026-06-24', team1: 'South Africa', team2: 'Korea Republic', group: 'A', venue: 'Estadio Monterrey', venueAr: 'ملعب مونتيري', round: 'group' },
  { id: 55, date: '2026-06-25', team1: 'Curaçao', team2: 'Côte d\'Ivoire', group: 'E', venue: 'Philadelphia Stadium', venueAr: 'ملعب فيلادلفيا', round: 'group' },
  { id: 56, date: '2026-06-25', team1: 'Ecuador', team2: 'Germany', group: 'E', venue: 'New York New Jersey Stadium', venueAr: 'ملعب نيويورك نيو جيرسي', round: 'group' },
  { id: 57, date: '2026-06-25', team1: 'Japan', team2: 'Sweden', group: 'F', venue: 'Dallas Stadium', venueAr: 'ملعب دالاس', round: 'group' },
  { id: 58, date: '2026-06-25', team1: 'Tunisia', team2: 'Netherlands', group: 'F', venue: 'Kansas City Stadium', venueAr: 'ملعب كانساس سيتي', round: 'group' },
  { id: 59, date: '2026-06-25', team1: 'Türkiye', team2: 'United States', group: 'D', venue: 'Los Angeles Stadium', venueAr: 'ملعب لوس أنجلوس', round: 'group' },
  { id: 60, date: '2026-06-25', team1: 'Paraguay', team2: 'Australia', group: 'D', venue: 'San Francisco Bay Area Stadium', venueAr: 'ملعب سان فرانسيسكو', round: 'group' },
  { id: 61, date: '2026-06-26', team1: 'Norway', team2: 'France', group: 'I', venue: 'Boston Stadium', venueAr: 'ملعب بوسطن', round: 'group' },
  { id: 62, date: '2026-06-26', team1: 'Senegal', team2: 'Iraq', group: 'I', venue: 'Toronto Stadium', venueAr: 'ملعب تورنتو', round: 'group' },
  { id: 63, date: '2026-06-26', team1: 'Egypt', team2: 'IR Iran', group: 'G', venue: 'Seattle Stadium', venueAr: 'ملعب سياتل', round: 'group' },
  { id: 64, date: '2026-06-26', team1: 'New Zealand', team2: 'Belgium', group: 'G', venue: 'BC Place Vancouver', venueAr: 'ملعب فانكوفر', round: 'group' },
  { id: 65, date: '2026-06-26', team1: 'Cabo Verde', team2: 'Saudi Arabia', group: 'H', venue: 'Houston Stadium', venueAr: 'ملعب هيوستن', round: 'group' },
  { id: 66, date: '2026-06-26', team1: 'Uruguay', team2: 'Spain', group: 'H', venue: 'Estadio Guadalajara', venueAr: 'ملعب غوادالاخارا', round: 'group' },
  { id: 67, date: '2026-06-27', team1: 'Panama', team2: 'England', group: 'L', venue: 'New York New Jersey Stadium', venueAr: 'ملعب نيويورك نيو جيرسي', round: 'group' },
  { id: 68, date: '2026-06-27', team1: 'Croatia', team2: 'Ghana', group: 'L', venue: 'Philadelphia Stadium', venueAr: 'ملعب فيلادلفيا', round: 'group' },
  { id: 69, date: '2026-06-27', team1: 'Algeria', team2: 'Austria', group: 'J', venue: 'Kansas City Stadium', venueAr: 'ملعب كانساس سيتي', round: 'group' },
  { id: 70, date: '2026-06-27', team1: 'Jordan', team2: 'Argentina', group: 'J', venue: 'Dallas Stadium', venueAr: 'ملعب دالاس', round: 'group' },
  { id: 71, date: '2026-06-27', team1: 'Colombia', team2: 'Portugal', group: 'K', venue: 'Miami Stadium', venueAr: 'ملعب ميامي', round: 'group' },
  { id: 72, date: '2026-06-27', team1: 'Congo DR', team2: 'Uzbekistan', group: 'K', venue: 'Atlanta Stadium', venueAr: 'ملعب أتلانتا', round: 'group' },

  // ROUND OF 32
  { id: 73, date: '2026-06-28', team1: '2A', team2: '2B', team1Ref: '2A', team2Ref: '2B', venue: 'Los Angeles Stadium', venueAr: 'ملعب لوس أنجلوس', round: 'r32' },
  { id: 74, date: '2026-06-29', team1: '1E', team2: '3ABCDf', team1Ref: '1E', team2Ref: '3ABCDf', venue: 'Boston Stadium', venueAr: 'ملعب بوسطن', round: 'r32' },
  { id: 75, date: '2026-06-29', team1: '1F', team2: '2C', team1Ref: '1F', team2Ref: '2C', venue: 'Estadio Monterrey', venueAr: 'ملعب مونتيري', round: 'r32' },
  { id: 76, date: '2026-06-29', team1: '1C', team2: '2F', team1Ref: '1C', team2Ref: '2F', venue: 'Houston Stadium', venueAr: 'ملعب هيوستن', round: 'r32' },
  { id: 77, date: '2026-06-30', team1: '1I', team2: '3CDFGH', team1Ref: '1I', team2Ref: '3CDFGH', venue: 'New York New Jersey Stadium', venueAr: 'ملعب نيويورك نيو جيرسي', round: 'r32' },
  { id: 78, date: '2026-06-30', team1: '2E', team2: '2I', team1Ref: '2E', team2Ref: '2I', venue: 'Dallas Stadium', venueAr: 'ملعب دالاس', round: 'r32' },
  { id: 79, date: '2026-06-30', team1: '1A', team2: '3CEfHI', team1Ref: '1A', team2Ref: '3CEfHI', venue: 'Mexico City Stadium', venueAr: 'ملعب مكسيكو سيتي', round: 'r32' },
  { id: 80, date: '2026-07-01', team1: '1L', team2: '3EHIJK', team1Ref: '1L', team2Ref: '3EHIJK', venue: 'Atlanta Stadium', venueAr: 'ملعب أتلانتا', round: 'r32' },
  { id: 81, date: '2026-07-01', team1: '1D', team2: '3BEFIJ', team1Ref: '1D', team2Ref: '3BEFIJ', venue: 'San Francisco Bay Area Stadium', venueAr: 'ملعب سان فرانسيسكو', round: 'r32' },
  { id: 82, date: '2026-07-01', team1: '1G', team2: '3AEHIJ', team1Ref: '1G', team2Ref: '3AEHIJ', venue: 'Seattle Stadium', venueAr: 'ملعب سياتل', round: 'r32' },
  { id: 83, date: '2026-07-02', team1: '2K', team2: '2L', team1Ref: '2K', team2Ref: '2L', venue: 'Toronto Stadium', venueAr: 'ملعب تورنتو', round: 'r32' },
  { id: 84, date: '2026-07-02', team1: '1H', team2: '2J', team1Ref: '1H', team2Ref: '2J', venue: 'Los Angeles Stadium', venueAr: 'ملعب لوس أنجلوس', round: 'r32' },
  { id: 85, date: '2026-07-02', team1: '1B', team2: '3EFGIJ', team1Ref: '1B', team2Ref: '3EFGIJ', venue: 'BC Place Vancouver', venueAr: 'ملعب فانكوفر', round: 'r32' },
  { id: 86, date: '2026-07-03', team1: '1J', team2: '2H', team1Ref: '1J', team2Ref: '2H', venue: 'Miami Stadium', venueAr: 'ملعب ميامي', round: 'r32' },
  { id: 87, date: '2026-07-03', team1: '1K', team2: '3DEIJL', team1Ref: '1K', team2Ref: '3DEIJL', venue: 'Kansas City Stadium', venueAr: 'ملعب كانساس سيتي', round: 'r32' },
  { id: 88, date: '2026-07-03', team1: '2D', team2: '2G', team1Ref: '2D', team2Ref: '2G', venue: 'Dallas Stadium', venueAr: 'ملعب دالاس', round: 'r32' },

  // ROUND OF 16
  { id: 89, date: '2026-07-04', team1: 'W74', team2: 'W77', team1Ref: 'W74', team2Ref: 'W77', venue: 'Philadelphia Stadium', venueAr: 'ملعب فيلادلفيا', round: 'r16' },
  { id: 90, date: '2026-07-04', team1: 'W73', team2: 'W75', team1Ref: 'W73', team2Ref: 'W75', venue: 'Houston Stadium', venueAr: 'ملعب هيوستن', round: 'r16' },
  { id: 91, date: '2026-07-05', team1: 'W76', team2: 'W78', team1Ref: 'W76', team2Ref: 'W78', venue: 'New York New Jersey Stadium', venueAr: 'ملعب نيويورك نيو جيرسي', round: 'r16' },
  { id: 92, date: '2026-07-05', team1: 'W79', team2: 'W80', team1Ref: 'W79', team2Ref: 'W80', venue: 'Mexico City Stadium', venueAr: 'ملعب مكسيكو سيتي', round: 'r16' },
  { id: 93, date: '2026-07-06', team1: 'W83', team2: 'W84', team1Ref: 'W83', team2Ref: 'W84', venue: 'Dallas Stadium', venueAr: 'ملعب دالاس', round: 'r16' },
  { id: 94, date: '2026-07-06', team1: 'W81', team2: 'W82', team1Ref: 'W81', team2Ref: 'W82', venue: 'Seattle Stadium', venueAr: 'ملعب سياتل', round: 'r16' },
  { id: 95, date: '2026-07-07', team1: 'W86', team2: 'W88', team1Ref: 'W86', team2Ref: 'W88', venue: 'Atlanta Stadium', venueAr: 'ملعب أتلانتا', round: 'r16' },
  { id: 96, date: '2026-07-07', team1: 'W85', team2: 'W87', team1Ref: 'W85', team2Ref: 'W87', venue: 'BC Place Vancouver', venueAr: 'ملعب فانكوفر', round: 'r16' },

  // QUARTER-FINALS
  { id: 97, date: '2026-07-09', team1: 'W89', team2: 'W90', team1Ref: 'W89', team2Ref: 'W90', venue: 'Boston Stadium', venueAr: 'ملعب بوسطن', round: 'qf' },
  { id: 98, date: '2026-07-10', team1: 'W93', team2: 'W94', team1Ref: 'W93', team2Ref: 'W94', venue: 'Los Angeles Stadium', venueAr: 'ملعب لوس أنجلوس', round: 'qf' },
  { id: 99, date: '2026-07-11', team1: 'W91', team2: 'W92', team1Ref: 'W91', team2Ref: 'W92', venue: 'Miami Stadium', venueAr: 'ملعب ميامي', round: 'qf' },
  { id: 100, date: '2026-07-11', team1: 'W95', team2: 'W96', team1Ref: 'W95', team2Ref: 'W96', venue: 'Kansas City Stadium', venueAr: 'ملعب كانساس سيتي', round: 'qf' },

  // SEMI-FINALS
  { id: 101, date: '2026-07-14', team1: 'W97', team2: 'W98', team1Ref: 'W97', team2Ref: 'W98', venue: 'Dallas Stadium', venueAr: 'ملعب دالاس', round: 'sf' },
  { id: 102, date: '2026-07-15', team1: 'W99', team2: 'W100', team1Ref: 'W99', team2Ref: 'W100', venue: 'Atlanta Stadium', venueAr: 'ملعب أتلانتا', round: 'sf' },

  // THIRD PLACE
  { id: 103, date: '2026-07-18', team1: 'L101', team2: 'L102', team1Ref: 'L101', team2Ref: 'L102', venue: 'Miami Stadium', venueAr: 'ملعب ميامي', round: '3rd' },

  // FINAL
  { id: 104, date: '2026-07-19', team1: 'W101', team2: 'W102', team1Ref: 'W101', team2Ref: 'W102', venue: 'New York New Jersey Stadium', venueAr: 'ملعب نيويورك نيو جيرسي', round: 'final' },
];

// Mapping of 3rd place reference to eligible groups
export const THIRD_PLACE_ELIGIBLE_GROUPS: Record<string, string[]> = {
  '3ABCDf': ['A', 'B', 'C', 'D', 'F'],
  '3CDFGH': ['C', 'D', 'F', 'G', 'H'],
  '3CEfHI': ['C', 'E', 'F', 'H', 'I'],
  '3EHIJK': ['E', 'H', 'I', 'J', 'K'],
  '3BEFIJ': ['B', 'E', 'F', 'I', 'J'],
  '3AEHIJ': ['A', 'E', 'H', 'I', 'J'],
  '3EFGIJ': ['E', 'F', 'G', 'I', 'J'],
  '3DEIJL': ['D', 'E', 'I', 'J', 'L'],
};

// Resolve team reference to actual team name
// e.g., "1A" -> group A winner, "2B" -> group B runner-up
export const resolveTeamRef = (
  ref: string,
  standings: Record<string, GroupStanding[]>,
  thirdPlaceRanking: { group: string; team: string }[],
  results: Record<number, { homeGoals: number; awayGoals: number; homePenalties?: number; awayPenalties?: number }>,
): string | null => {
  // Group winner: "1A", "1B", etc.
  const winnerMatch = ref.match(/^1([A-L])$/);
  if (winnerMatch) {
    const group = winnerMatch[1];
    const groupStandings = standings[group];
    if (groupStandings && groupStandings.length > 0) {
      return groupStandings[0].team;
    }
    return null;
  }

  // Group runner-up: "2A", "2B", etc.
  const runnerUpMatch = ref.match(/^2([A-L])$/);
  if (runnerUpMatch) {
    const group = runnerUpMatch[1];
    const groupStandings = standings[group];
    if (groupStandings && groupStandings.length > 1) {
      return groupStandings[1].team;
    }
    return null;
  }

  // Third place reference: "3ABCDf", "3CDFGH", etc.
  const thirdPlaceMatch = ref.match(/^3(.+)$/);
  if (thirdPlaceMatch) {
    const eligibleGroupsKey = ref;
    const eligibleGroups = THIRD_PLACE_ELIGIBLE_GROUPS[eligibleGroupsKey];
    if (!eligibleGroups) return null;

    // Find the best 3rd place team from eligible groups
    const eligibleThirdPlace = thirdPlaceRanking.filter(tp =>
      eligibleGroups.includes(tp.group)
    );
    if (eligibleThirdPlace.length > 0) {
      return eligibleThirdPlace[0].team;
    }
    return null;
  }

  // Winner of a match: "W73", "W74", etc.
  const winnerOfMatch = ref.match(/^W(\d+)$/);
  if (winnerOfMatch) {
    const matchId = parseInt(winnerOfMatch[1]);
    const result = results[matchId];
    if (!result) return null;
    const match = MATCHES.find(m => m.id === matchId);
    if (!match) return null;

    if (result.homeGoals > result.awayGoals) return match.team1;
    if (result.awayGoals > result.homeGoals) return match.team2;
    // Check penalties
    if (result.homePenalties !== undefined && result.awayPenalties !== undefined) {
      if (result.homePenalties > result.awayPenalties) return match.team1;
      if (result.awayPenalties > result.homePenalties) return match.team2;
    }
    return null;
  }

  // Loser of a match: "L101", "L102", etc.
  const loserOfMatch = ref.match(/^L(\d+)$/);
  if (loserOfMatch) {
    const matchId = parseInt(loserOfMatch[1]);
    const result = results[matchId];
    if (!result) return null;
    const match = MATCHES.find(m => m.id === matchId);
    if (!match) return null;

    if (result.homeGoals < result.awayGoals) return match.team1;
    if (result.awayGoals < result.homeGoals) return match.team2;
    // Check penalties
    if (result.homePenalties !== undefined && result.awayPenalties !== undefined) {
      if (result.homePenalties < result.awayPenalties) return match.team1;
      if (result.awayPenalties < result.homePenalties) return match.team2;
    }
    return null;
  }

  return null;
};

// Get display name for a team reference (Arabic)
export const getTeamRefDisplayName = (ref: string): string => {
  const winnerMatch = ref.match(/^1([A-L])$/);
  if (winnerMatch) {
    return `متصدّر المجموعة ${winnerMatch[1]}`;
  }
  const runnerUpMatch = ref.match(/^2([A-L])$/);
  if (runnerUpMatch) {
    return `وصيف المجموعة ${runnerUpMatch[1]}`;
  }
  const thirdPlaceMatch = ref.match(/^3(.+)$/);
  if (thirdPlaceMatch) {
    return `أفضل ثالث`;
  }
  const winnerOfMatch = ref.match(/^W(\d+)$/);
  if (winnerOfMatch) {
    return `الفائز من مباراة ${winnerOfMatch[1]}`;
  }
  const loserOfMatch = ref.match(/^L(\d+)$/);
  if (loserOfMatch) {
    return `الخاسر من مباراة ${loserOfMatch[1]}`;
  }
  return ref;
};
