exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const apiKey = params.apiKey;
  
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ valid: false, error: 'لم يتم إدخال مفتاح API' }),
    };
  }

  // Try api-sports.io first (with 8s timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch('https://v3.football.api-sports.io/status', {
      method: 'GET',
      headers: { 'x-apisports-key': apiKey },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (!data.errors || Object.keys(data.errors || {}).length === 0) {
        const account = data.response?.account;
        const subscription = data.response?.subscription;
        const requests = data.response?.requests;
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            valid: true, detectedType: 'apisports',
            accountInfo: { firstName: account?.firstname, lastName: account?.lastname, plan: subscription?.plan, requestsToday: requests?.current, requestsLimit: requests?.limit_day },
          }),
        };
      }
      const errMsg = Object.values(data.errors).join(', ');
      if (errMsg.includes('not subscribed')) {
        // Try RapidAPI
        return await tryRapidApi(apiKey);
      }
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ valid: false, error: errMsg }) };
    }
    
    if (response.status === 401) return await tryRapidApi(apiKey);
    if (response.status === 403) {
      let body = '';
      try { body = await response.text(); } catch {}
      if (body.includes('not subscribed')) return await tryRapidApi(apiKey);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ valid: false, error: 'المفتاح غير مفعّل. فعّل الاشتراك المجاني على api-sports.io أو استخدم RapidAPI' }) };
    }
    if (response.status === 429) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ valid: true, accountInfo: { plan: 'مجاني', requestsToday: '100+', requestsLimit: '100/يوم' } }) };
    }
  } catch (err) {
    // Timeout or network error - try RapidAPI
    return await tryRapidApi(apiKey);
  }

  return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ valid: false, error: 'لا يمكن التحقق من المفتاح' }) };
};

async function tryRapidApi(apiKey) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch('https://api-football-v1.p.rapidapi.com/v3/status', {
      method: 'GET',
      headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (!data.errors || Object.keys(data.errors || {}).length === 0) {
        const account = data.response?.account;
        const subscription = data.response?.subscription;
        const requests = data.response?.requests;
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            valid: true, detectedType: 'rapidapi',
            accountInfo: { firstName: account?.firstname, lastName: account?.lastname, plan: subscription?.plan, requestsToday: requests?.current, requestsLimit: requests?.limit_day },
          }),
        };
      }
    }
    if (response.status === 401 || response.status === 403) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ valid: false, error: 'مفتاح API غير صحيح لـ api-sports.io و RapidAPI. تحقق من نسخ المفتاح بالكامل' }) };
    }
  } catch {}
  return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ valid: false, error: 'لا يمكن التحقق من المفتاح. تحقق من الإنترنت وحاول مرة أخرى' }) };
}
