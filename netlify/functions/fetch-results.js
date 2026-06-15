// Netlify Function: Fetch match results from API-Football
// Proxies requests to api-football.com to keep API key server-side

const API_BASE = 'https://api-football-v1.p.rapidapi.com/v3';
const API_HOST = 'api-football-v1.p.rapidapi.com';

// World Cup 2026 league ID in API-Football (will be updated when available)
// For now, we try multiple possible IDs
const POSSIBLE_LEAGUE_IDS = [1, 2, 632, 1000]; // 1=FIFA World Cup, others are fallbacks

exports.handler = async (event) => {
  // Check for API key
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        count: 0,
        fixtures: [],
        error: 'API_KEY_NOT_CONFIGURED',
        message: 'مفتاح API غير مُعد. يرجى إعداد API_FOOTBALL_KEY في متغيرات بيئة Netlify.',
      }),
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const date = params.date; // YYYY-MM-DD format
    const leagueId = params.league || POSSIBLE_LEAGUE_IDS[0];
    const season = params.season || '2026';

    // Build API URL
    let url = `${API_BASE}/fixtures?league=${leagueId}&season=${season}`;
    if (date) {
      url += `&date=${date}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': API_HOST,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('API-Football error:', response.status, text);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          count: 0,
          fixtures: [],
          error: `API_ERROR_${response.status}`,
          message: `خطأ من API: ${response.status}`,
        }),
      };
    }

    const data = await response.json();

    // Map API-Football fixtures to our simplified format
    const fixtures = (data.response || []).map((fixture) => {
      const f = fixture.fixture;
      const teams = fixture.teams;
      const goals = fixture.goals;
      const score = fixture.score;

      return {
        id: f.id,
        date: f.date,
        status: f.status.short,
        statusLong: f.status.long,
        elapsed: f.status.elapsed,
        homeTeam: teams.home.name,
        awayTeam: teams.away.name,
        homeLogo: teams.home.logo,
        awayLogo: teams.away.logo,
        goalsHome: goals.home,
        goalsAway: goals.away,
        scoreFulltimeHome: score.fulltime.home,
        scoreFulltimeAway: score.fulltime.away,
        scoreExtratimeHome: score.extratime?.home ?? null,
        scoreExtratimeAway: score.extratime?.away ?? null,
        scorePenaltyHome: score.penalty?.home ?? null,
        scorePenaltyAway: score.penalty?.away ?? null,
        round: fixture.league.round,
        venue: f.venue?.name,
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        count: fixtures.length,
        fixtures,
      }),
    };
  } catch (error) {
    console.error('fetch-results error:', error);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        count: 0,
        fixtures: [],
        error: 'NETWORK_ERROR',
        message: 'خطأ في الاتصال بالخادم',
      }),
    };
  }
};
