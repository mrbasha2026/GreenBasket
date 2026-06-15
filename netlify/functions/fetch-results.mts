import type { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API_FOOTBALL_KEY not configured. Set it in Netlify environment variables.' }),
    };
  }

  // Get optional date filter from query params
  const params = event.queryStringParameters || {};
  const date = params.date || ''; // e.g., 2026-06-11
  const round = params.round || ''; // e.g., Group Stage - 1
  const fixtureId = params.fixture || ''; // specific fixture ID

  try {
    let url = 'https://v3.football.api-sports.io/fixtures?league=1&season=2026';

    if (fixtureId) {
      url += `&fixture=${fixtureId}`;
    } else if (date) {
      url += `&date=${date}`;
    } else if (round) {
      url += `&round=${encodeURIComponent(round)}`;
    }

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

    // Return only what we need to minimize response size
    const fixtures = (data.response || []).map((fixture: any) => ({
      id: fixture.fixture?.id,
      date: fixture.fixture?.date,
      status: fixture.fixture?.status?.short,
      statusLong: fixture.fixture?.status?.long,
      elapsed: fixture.fixture?.status?.elapsed,
      homeTeam: fixture.teams?.home?.name,
      awayTeam: fixture.teams?.away?.name,
      homeLogo: fixture.teams?.home?.logo,
      awayLogo: fixture.teams?.away?.logo,
      goalsHome: fixture.goals?.home,
      goalsAway: fixture.goals?.away,
      scoreFulltimeHome: fixture.score?.fulltime?.home,
      scoreFulltimeAway: fixture.score?.fulltime?.away,
      scoreExtratimeHome: fixture.score?.extratime?.home,
      scoreExtratimeAway: fixture.score?.extratime?.away,
      scorePenaltyHome: fixture.score?.penalty?.home,
      scorePenaltyAway: fixture.score?.penalty?.away,
      round: fixture.league?.round,
      venue: fixture.fixture?.venue?.name,
    }));

    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'public, max-age=60', // Cache for 60 seconds
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
      body: JSON.stringify({ error: error.message || 'Failed to fetch from API-Football' }),
    };
  }
};

export { handler };
