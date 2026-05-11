exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return {statusCode:405,body:'Method not allowed'};

  try {
    const body = JSON.parse(event.body);
    const { imageBase64, mediaType, scene } = body;

    const sceneDescriptions = {
      'Frente al Castillo de Cinderella': 'in front of Cinderella Castle at Magic Kingdom Disney World. Pink and blue castle behind them, blue sky, colorful flags.',
      'Show de fuegos artificiales': 'at Magic Kingdom watching fireworks. Colorful fireworks above Cinderella Castle at night.',
      'Main Street de noche': 'on Main Street USA at Disney World at night. Festive lights, Disney shops on both sides.',
      'Animal Kingdom': 'at Animal Kingdom Disney World. Tree of Life in background, tropical vegetation.',
      'Hollywood Studios': 'at Hollywood Studios. Chinese Theatre in background, Hollywood Boulevard.'
    };

    const sceneDesc = sceneDescriptions[scene] || 'at Magic Kingdom Disney World in front of Cinderella Castle';
    const prompt = `Place these exact same people from the photo ${sceneDesc}. Mickey Mouse and Minnie Mouse are posing next to them. Keep faces exactly the same. Professional Disney vacation photo, bright colors, magical atmosphere.`;

    // Use imagen-3.0-generate-002 which supports image generation
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          instances: [{ prompt: prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            safetyFilterLevel: 'block_few',
            personGeneration: 'allow_adult'
          }
        })
      }
    );

    const data = await resp.json();
    console.log('Gemini imagen status:', resp.status, JSON.stringify(data).substring(0,300));

    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if(!b64) {
      return {statusCode:500, body: JSON.stringify({error:'No image', detail: data})};
    }

    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
      body: JSON.stringify({ imageBase64: `data:image/jpeg;base64,${b64}` })
    };

  } catch(e) {
    console.log('Error:', e.message);
    return {statusCode:500, body: JSON.stringify({error: e.message})};
  }
};
