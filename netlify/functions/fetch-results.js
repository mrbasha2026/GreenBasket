// Netlify Function: Fetch comprehensive match data from API-Football
// v4: Uses v3.football.api-sports.io (NOT RapidAPI) + date-based queries for free plan
const DEPLOY_VERSION = 'v4-api-sports-direct';

const API_BASE = 'https://v3.football.api-sports.io';
const API_HOST = 'v3.football.api-sports.io';

function makeHeaders(apiKey) {
  return {
    'x-apisports-key': apiKey,
  };
}

function errorResponse(error, message) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ success: false, count: 0, fixtures: [], error, message }),
  };
}

function mapFixture(fixture) {
  const f = fixture.fixture;
  const teams = fixture.teams;
  const goals = fixture.goals;
  const score = fixture.score;
  const league = fixture.league;
  return {
    id: f.id,
    date: f.date,
    timestamp: f.timestamp,
    status: f.status.short,
    statusLong: f.status.long,
    elapsed: f.status.elapsed,
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
    homeTeamId: teams.home.id,
    awayTeamId: teams.away.id,
    homeLogo: teams.home.logo,
    awayLogo: teams.away.logo,
    homeWinner: teams.home.winner,
    awayWinner: teams.away.winner,
    goalsHome: goals.home,
    goalsAway: goals.away,
    scoreHalftimeHome: score.halftime?.home ?? null,
    scoreHalftimeAway: score.halftime?.away ?? null,
    scoreFulltimeHome: score.fulltime.home,
    scoreFulltimeAway: score.fulltime.away,
    scoreExtratimeHome: score.extratime?.home ?? null,
    scoreExtratimeAway: score.extratime?.away ?? null,
    scorePenaltyHome: score.penalty?.home ?? null,
    scorePenaltyAway: score.penalty?.away ?? null,
    leagueId: league.id,
    leagueName: league.name,
    leagueLogo: league.logo,
    leagueFlag: league.flag,
    round: league.round,
    venueName: f.venue?.name,
    venueCity: f.venue?.city,
    venueId: f.venue?.id,
    referee: f.referee,
  };
}

// Fetch with error handling - returns { data, error } for better diagnostics
async function apiFetch(url, apiKey) {
  try {
    const response = await fetch(url, { method: 'GET', headers: makeHeaders(apiKey) });
    const text = await response.text();
    if (!response.ok) {
      console.error('API-Football error:', response.status, text.substring(0, 500));
      return { data: null, error: `HTTP_${response.status}: ${text.substring(0, 200)}` };
    }
    try {
      const json = JSON.parse(text);
      // Check for API-level errors (rate limits, etc)
      if (json.errors && Object.keys(json.errors).length > 0) {
        const errMsg = Object.values(json.errors).join(', ');
        console.error('API-Football API error:', errMsg);
        return { data: null, error: errMsg };
      }
      return { data: json, error: null };
    } catch (parseErr) {
      console.error('API-Football parse error:', text.substring(0, 200));
      return { data: null, error: 'INVALID_JSON' };
    }
  } catch (fetchErr) {
    console.error('API-Football fetch error:', fetchErr.message);
    return { data: null, error: fetchErr.message };
  }
}

exports.handler = async (event) => {
  // Support API key from query parameter (client-provided) or env var
  // Priority: client key > env var
  const clientKey = (event.queryStringParameters || {}).apiKey;
  const envKey = process.env.API_FOOTBALL_KEY;
  const apiKey = clientKey || envKey;
  
  // Version check endpoint - helps debug deployment issues
  if ((event.queryStringParameters || {}).check === 'version') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        version: DEPLOY_VERSION,
        apiBase: API_BASE,
        keyConfigured: !!apiKey,
        keySource: clientKey ? 'client' : (envKey ? 'env' : 'none'),
        keyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'NONE',
      }),
    };
  }
  
  if (!apiKey) {
    return errorResponse('API_KEY_NOT_CONFIGURED', 'مفتاح API غير مُعد. يرجى إدخال مفتاح API من الإعدادات أو إعداد API_FOOTBALL_KEY في متغيرات بيئة Netlify.');
  }

  try {
    const params = event.queryStringParameters || {};
    const date = params.date;
    const leagueId = params.league || '1';
    const season = params.season || '2026';
    const fixtureId = params.fixture; // single fixture ID for detailed data
    const include = (params.include || '').split(','); // events,lineups,statistics,standings

    // === Single fixture detail mode ===
    if (fixtureId) {
      const result = { success: true, fixture: null, events: [], lineups: [], statistics: [] };

      // Fetch fixture details
      const fixtureRes = await apiFetch(`${API_BASE}/fixtures?id=${fixtureId}`, apiKey);
      if (fixtureRes.error) return errorResponse('API_ERROR', `خطأ من API: ${fixtureRes.error}`);
      if (fixtureRes.data?.response?.[0]) {
        result.fixture = mapFixture(fixtureRes.data.response[0]);
      }

      // Fetch events (goals, cards, substitutions)
      if (include.includes('events') || include.length === 0 || (include.length === 1 && include[0] === '')) {
        const eventsRes = await apiFetch(`${API_BASE}/fixtures/events?fixture=${fixtureId}`, apiKey);
        if (eventsRes.data?.response) {
          result.events = eventsRes.data.response.map(e => ({
            time: { elapsed: e.time.elapsed, extra: e.time.extra },
            type: e.type,
            detail: e.detail,
            team: { name: e.team.name, id: e.team.id, logo: e.team.logo },
            player: { name: e.player.name, id: e.player.id },
            assist: { name: e.assist.name, id: e.assist.id },
            comments: e.comments,
          }));
        }
      }

      // Fetch lineups
      if (include.includes('lineups') || include.length === 0 || (include.length === 1 && include[0] === '')) {
        const lineupsRes = await apiFetch(`${API_BASE}/fixtures/lineups?fixture=${fixtureId}`, apiKey);
        if (lineupsRes.data?.response) {
          result.lineups = lineupsRes.data.response.map(l => ({
            team: { name: l.team.name, id: l.team.id, logo: l.team.logo, colors: l.team.colors },
            formation: l.formation,
            startXI: l.startXI.map(p => ({
              player: { name: p.player.name, number: p.player.number, pos: p.player.pos, grid: p.player.grid },
            })),
            substitutes: l.substitutes.map(p => ({
              player: { name: p.player.name, number: p.player.number, pos: p.player.pos, grid: p.player.grid },
            })),
            coach: l.coach?.name,
          }));
        }
      }

      // Fetch match statistics
      if (include.includes('statistics') || include.length === 0 || (include.length === 1 && include[0] === '')) {
        const statsRes = await apiFetch(`${API_BASE}/fixtures/statistics?fixture=${fixtureId}`, apiKey);
        if (statsRes.data?.response) {
          result.statistics = statsRes.data.response.map(s => ({
            team: { name: s.team.name, id: s.team.id, logo: s.team.logo },
            statistics: s.statistics.map(st => ({
              type: st.type,
              value: st.value,
            })),
          }));
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(result),
      };
    }

    // === Date-based fixtures mode ===
    // IMPORTANT: Free plans don't support league+season=2026 together.
    // Instead, we use date-based queries WITHOUT season, then filter for World Cup (league=1)
    let url;
    if (date) {
      // Use date-only query (works on free plan), then filter for World Cup league
      url = `${API_BASE}/fixtures?date=${date}`;
    } else {
      // Fallback: try league+season first
      url = `${API_BASE}/fixtures?league=${leagueId}&season=${season}`;
    }

    const mainRes = await apiFetch(url, apiKey);
    
    // Check if season is not accessible (free plan limitation)
    if (mainRes.data?.errors?.plan || mainRes.data?.errors?.season) {
      // If league+season failed, try date-only approach as fallback
      if (date && !url.includes('date=')) {
        const fallbackUrl = `${API_BASE}/fixtures?date=${date}`;
        const fallbackRes = await apiFetch(fallbackUrl, apiKey);
        if (fallbackRes.data && !fallbackRes.error) {
          // Filter for World Cup league only
          const wcFixtures = (fallbackRes.data.response || []).filter(f => f.league?.id === parseInt(leagueId));
          const fixtures = wcFixtures.map(mapFixture);
          
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true, count: fixtures.length, fixtures, standings: null }),
          };
        }
      }
      return errorResponse('SEASON_NOT_ACCESSIBLE', `الخطة المجانية لا تدعم موسم ${season}. ` + (mainRes.data?.errors?.plan || mainRes.data?.errors?.season || ''));
    }
    
    if (mainRes.error) return errorResponse('API_ERROR', `خطأ من API: ${mainRes.error}`);
    if (!mainRes.data) return errorResponse('API_ERROR', 'لا توجد بيانات من API');

    // If we used date-only query, filter for World Cup league
    let allFixtures = mainRes.data.response || [];
    if (date && allFixtures.length > 0 && allFixtures[0].league?.id !== parseInt(leagueId)) {
      // Date-only query returns all leagues - filter for World Cup
      allFixtures = allFixtures.filter(f => f.league?.id === parseInt(leagueId));
    }
    const fixtures = allFixtures.map(mapFixture);

    // Fetch standings if requested
    let standings = null;
    if (include.includes('standings')) {
      const standingsRes = await apiFetch(`${API_BASE}/standings?league=${leagueId}&season=${season}`, apiKey);
      if (standingsRes.data?.response?.[0]?.league) {
        const league = standingsRes.data.response[0].league;
        standings = {
          league: { id: league.id, name: league.name, logo: league.logo, flag: league.flag },
          groups: (league.standings || []).map(group => group.map(team => ({
            rank: team.rank,
            team: { name: team.team.name, id: team.team.id, logo: team.team.logo },
            points: team.points,
            all: team.all,
            form: team.form,
            goalsDiff: team.goalsDiff,
            description: team.description,
          }))),
        };
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        count: fixtures.length,
        fixtures,
        standings,
      }),
    };
  } catch (error) {
    console.error('fetch-results error:', error);
    return errorResponse('NETWORK_ERROR', 'خطأ في الاتصال بالخادم');
  }
};
// Deploy v5 - force rebuild
