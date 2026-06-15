exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const apiKey = params.apiKey;
  
  // Set overall timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ valid: false, error: 'لم يتم إدخال مفتاح API' }),
    };
  }

  // Try api-sports.io first
  try {
    const response = await fetch('https://v3.football.api-sports.io/status', {
      method: 'GET',
      headers: { 'x-apisports-key': apiKey },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 401) {
      // Key format is wrong for api-sports.io, try RapidAPI
      return await testRapidApi(apiKey);
    }
    
    if (response.status === 403) {
      // Check if it's "not subscribed" or just wrong key
      let body = '';
      try { body = await response.text(); } catch {}
      if (body.includes('not subscribed')) {
        // Key is valid format but not subscribed - try RapidAPI
        return await testRapidApi(apiKey);
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ valid: false, error: 'المفتاح غير مشترك في API-Football. فعّل الاشتراك المجاني على api-sports.io أو جرب RapidAPI' }),
      };
    }

    if (response.status === 429) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ valid: true, accountInfo: { plan: 'مجاني', requestsToday: '100+', requestsLimit: '100/يوم' } }),
      };
    }

    if (response.ok) {
      const data = await response.json();
      if (data.errors && Object.keys(data.errors).length > 0) {
        const errMsg = Object.values(data.errors).join(', ');
        if (errMsg.includes('not subscribed') || errMsg.includes('plan')) {
          return await testRapidApi(apiKey);
        }
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
    }
  } catch (err) {
    clearTimeout(timeout);
    // Network error or abort - try RapidAPI
    try {
      return await testRapidApi(apiKey);
    } catch {}
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ valid: false, error: 'لا يمكن الاتصال بخادم API. تحقق من الإنترنت.' }),
  };
};

async function testRapidApi(apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch('https://api-football-v1.p.rapidapi.com/v3/status', {
      method: 'GET',
      headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (response.status === 401 || response.status === 403) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ valid: false, error: 'مفتاح API غير صحيح لـ api-sports.io و RapidAPI. تحقق من نسخ المفتاح بالكامل.' }),
      };
    }

    if (response.ok) {
      const data = await response.json();
      if (data.errors && Object.keys(data.errors).length > 0) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ valid: false, error: Object.values(data.errors).join(', ') }),
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
          detectedType: 'rapidapi',
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
    }
  } catch (err) {
    clearTimeout(timeout);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ valid: false, error: 'مفتاح API غير صحيح. تحقق من المفتاح وحاول مرة أخرى.' }),
  };
}
