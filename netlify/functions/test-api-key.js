exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const apiKey = params.apiKey;
  
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ valid: false, error: 'No API key provided' }),
    };
  }

  try {
    const response = await fetch('https://v3.football.api-sports.io/status', {
      method: 'GET',
      headers: { 'x-apisports-key': apiKey },
    });

    if (!response.ok) {
      let errorBody = '';
      try { errorBody = await response.text(); } catch {}
      if (response.status === 403) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ valid: false, error: 'المفتاح غير مشترك في API-Football. فعّل الاشتراك المجاني على api-sports.io أو جرب نوع RapidAPI' }),
        };
      }
      if (response.status === 401) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ valid: false, error: 'مفتاح API غير صحيح' }),
        };
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ valid: false, error: `خطأ HTTP ${response.status}: ${errorBody.substring(0, 200)}` }),
      };
    }

    const data = await response.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
      const errMsg = Object.values(data.errors).join(', ');
      // Try RapidAPI with the same key
      try {
        const rapidResponse = await fetch('https://api-football-v1.p.rapidapi.com/v3/status', {
          method: 'GET',
          headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' },
        });
        if (rapidResponse.ok) {
          const rapidData = await rapidResponse.json();
          if (!rapidData.errors || Object.keys(rapidData.errors || {}).length === 0) {
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ 
                valid: true, 
                detectedType: 'rapidapi',
                accountInfo: {
                  plan: rapidData.response?.subscription?.plan || 'RapidAPI',
                  requestsToday: rapidData.response?.requests?.current,
                  requestsLimit: rapidData.response?.requests?.limit_day,
                }
              }),
            };
          }
        }
      } catch {}
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ valid: false, error: errMsg }),
      };
    }

    const account = data.response?.account;
    const subscription = data.response?.subscription;
    const requests = data.response?.requests;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        valid: true,
        detectedType: 'apisports',
        accountInfo: {
          firstName: account?.firstname,
          lastName: account?.lastname,
          plan: subscription?.plan,
          endDate: subscription?.end,
          requestsToday: requests?.current,
          requestsLimit: requests?.limit_day,
        },
      }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ valid: false, error: `فشل الاتصال: ${err.message}` }),
    };
  }
};
