import type { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API_FOOTBALL_KEY not configured' }),
    };
  }

  // Get live matches only
  try {
    const url = 'https://v3.football.api-sports.io/fixtures?league=1&season=2026&live=all';

    const response = await fetch(url, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `API returned ${response.status}` }),
      };
    }

    const data = await response.json();

    const fixtures = (data.response || []).map((fixture: any) => ({
      id: fixture.fixture?.id,
      date: fixture.fixture?.date,
      status: fixture.fixture?.status?.short,
      statusLong: fixture.fixture?.status?.long,
      elapsed: fixture.fixture?.status?.elapsed,
      homeTeam: fixture.teams?.home?.name,
      awayTeam: fixture.teams?.away?.name,
      goalsHome: fixture.goals?.home,
      goalsAway: fixture.goals?.away,
      scoreFulltimeHome: fixture.score?.fulltime?.home,
      scoreFulltimeAway: fixture.score?.fulltime?.away,
      scorePenaltyHome: fixture.score?.penalty?.home,
      scorePenaltyAway: fixture.score?.penalty?.away,
    }));

    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'public, max-age=15',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        count: fixtures.length,
        fixtures,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to fetch live matches' }),
    };
  }
};

export { handler };
