exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return {statusCode:405,body:'Method not allowed'};

  try {
    const body = JSON.parse(event.body);
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
      body: JSON.stringify(data)
    };
  } catch(e) {
    return {statusCode:500, body: JSON.stringify({error: e.message})};
  }
};
