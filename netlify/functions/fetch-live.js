// Netlify Function: Fetch live match data with events from API-Football
// For live matches, we also fetch events (goals, cards, subs) in real-time

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
    round: league.round,
    venueName: f.venue?.name,
    venueCity: f.venue?.city,
    referee: f.referee,
  };
}

async function apiFetch(url, apiKey) {
  try {
    const response = await fetch(url, { method: 'GET', headers: makeHeaders(apiKey) });
    const text = await response.text();
    if (!response.ok) {
      return { data: null, error: `HTTP_${response.status}: ${text.substring(0, 200)}` };
    }
    try {
      const json = JSON.parse(text);
      if (json.errors && Object.keys(json.errors).length > 0) {
        return { data: null, error: Object.values(json.errors).join(', ') };
      }
      return { data: json, error: null };
    } catch {
      return { data: null, error: 'INVALID_JSON' };
    }
  } catch (fetchErr) {
    return { data: null, error: fetchErr.message };
  }
}

exports.handler = async (event) => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return errorResponse('API_KEY_NOT_CONFIGURED', 'مفتاح API غير مُعد');

  try {
    const params = event.queryStringParameters || {};
    const leagueId = params.league || '1';
    const season = params.season || '2026';
    const includeEvents = params.events !== 'false'; // default true
    const includeLineups = params.lineups === 'true';
    const includeStats = params.stats === 'true';

    // Fetch live fixtures
    const url = `${API_BASE}/fixtures?live=all&league=${leagueId}&season=${season}`;
    const mainRes = await apiFetch(url, apiKey);
    if (mainRes.error) return errorResponse('API_ERROR', `خطأ من API: ${mainRes.error}`);
    if (!mainRes.data) return errorResponse('API_ERROR', 'لا توجد بيانات من API');

    const fixtures = (mainRes.data.response || []).map(mapFixture);

    // For live matches, also fetch events for each fixture
    const fixturesWithDetails = [];
    for (const fixture of fixtures) {
      const enhanced = { ...fixture, events: [], lineups: [], statistics: [] };

      if (includeEvents && fixtures.length <= 5) {
        const eventsRes = await apiFetch(`${API_BASE}/fixtures/events?fixture=${fixture.id}`, apiKey);
        if (eventsRes.data?.response) {
          enhanced.events = eventsRes.data.response.map(e => ({
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

      if (includeLineups && fixtures.length <= 3) {
        const lineupsRes = await apiFetch(`${API_BASE}/fixtures/lineups?fixture=${fixture.id}`, apiKey);
        if (lineupsRes.data?.response) {
          enhanced.lineups = lineupsRes.data.response.map(l => ({
            team: { name: l.team.name, id: l.team.id, logo: l.team.logo },
            formation: l.formation,
            startXI: l.startXI.map(p => ({ player: { name: p.player.name, number: p.player.number, pos: p.player.pos } })),
            substitutes: l.substitutes.map(p => ({ player: { name: p.player.name, number: p.player.number, pos: p.player.pos } })),
            coach: l.coach?.name,
          }));
        }
      }

      if (includeStats && fixtures.length <= 3) {
        const statsRes = await apiFetch(`${API_BASE}/fixtures/statistics?fixture=${fixture.id}`, apiKey);
        if (statsRes.data?.response) {
          enhanced.statistics = statsRes.data.response.map(s => ({
            team: { name: s.team.name, id: s.team.id },
            statistics: s.statistics.map(st => ({ type: st.type, value: st.value })),
          }));
        }
      }

      fixturesWithDetails.push(enhanced);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        count: fixturesWithDetails.length,
        fixtures: fixturesWithDetails,
      }),
    };
  } catch (error) {
    console.error('fetch-live error:', error);
    return errorResponse('NETWORK_ERROR', 'خطأ في الاتصال بالخادم');
  }
};
