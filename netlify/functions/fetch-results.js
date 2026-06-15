// Netlify Function: Fetch comprehensive match data from API-Football
// Includes: fixtures, events, lineups, statistics, standings
// Proxies requests to api-football.com to keep API key server-side

const API_BASE = 'https://api-football-v1.p.rapidapi.com/v3';
const API_HOST = 'api-football-v1.p.rapidapi.com';

function makeHeaders(apiKey) {
  return {
    'x-apisports-key': apiKey,
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': API_HOST,
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

// Fetch with error handling
async function apiFetch(url, apiKey) {
  const response = await fetch(url, { method: 'GET', headers: makeHeaders(apiKey) });
  if (!response.ok) {
    const text = await response.text();
    console.error('API-Football error:', response.status, text.substring(0, 200));
    return null;
  }
  return response.json();
}

exports.handler = async (event) => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return errorResponse('API_KEY_NOT_CONFIGURED', 'مفتاح API غير مُعد. يرجى إعداد API_FOOTBALL_KEY في متغيرات بيئة Netlify.');
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
      const fixtureData = await apiFetch(`${API_BASE}/fixtures?id=${fixtureId}`, apiKey);
      if (fixtureData?.response?.[0]) {
        result.fixture = mapFixture(fixtureData.response[0]);
      }

      // Fetch events (goals, cards, substitutions)
      if (include.includes('events') || include.length === 0 || (include.length === 1 && include[0] === '')) {
        const eventsData = await apiFetch(`${API_BASE}/fixtures/events?fixture=${fixtureId}`, apiKey);
        if (eventsData?.response) {
          result.events = eventsData.response.map(e => ({
            time: { elapsed: e.time.elapsed, extra: e.time.extra },
            type: e.type,       // Goal, Card, subst
            detail: e.detail,   // Normal Goal, Own Goal, Penalty, Yellow Card, Red Card, etc.
            team: { name: e.team.name, id: e.team.id, logo: e.team.logo },
            player: { name: e.player.name, id: e.player.id },
            assist: { name: e.assist.name, id: e.assist.id },
            comments: e.comments,
          }));
        }
      }

      // Fetch lineups
      if (include.includes('lineups') || include.length === 0 || (include.length === 1 && include[0] === '')) {
        const lineupsData = await apiFetch(`${API_BASE}/fixtures/lineups?fixture=${fixtureId}`, apiKey);
        if (lineupsData?.response) {
          result.lineups = lineupsData.response.map(l => ({
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
        const statsData = await apiFetch(`${API_BASE}/fixtures/statistics?fixture=${fixtureId}`, apiKey);
        if (statsData?.response) {
          result.statistics = statsData.response.map(s => ({
            team: { name: s.team.name, id: s.team.id, logo: s.team.logo },
            statistics: s.statistics.map(st => ({
              type: st.type,    // Shots on Goal, Ball Possession, etc.
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
    let url = `${API_BASE}/fixtures?league=${leagueId}&season=${season}`;
    if (date) url += `&date=${date}`;

    const data = await apiFetch(url, apiKey);
    if (!data) return errorResponse('API_ERROR', 'خطأ من API');

    const fixtures = (data.response || []).map(mapFixture);

    // Fetch standings if requested
    let standings = null;
    if (include.includes('standings')) {
      const standingsData = await apiFetch(`${API_BASE}/standings?league=${leagueId}&season=${season}`, apiKey);
      if (standingsData?.response?.[0]?.league) {
        const league = standingsData.response[0].league;
        standings = {
          league: { id: league.id, name: league.name, logo: league.logo, flag: league.flag },
          groups: (league.standings || []).map(group => group.map(team => ({
            rank: team.rank,
            team: { name: team.team.name, id: team.team.id, logo: team.team.logo },
            points: team.points,
            all: team.all,        // { played, win, draw, lose, goals: { for, against } }
            form: team.form,      // e.g. "WWDLW"
            goalsDiff: team.goalsDiff,
            description: team.description, // e.g. "Promotion - Final Tournament"
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
