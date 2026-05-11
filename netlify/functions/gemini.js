exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return {statusCode:405,body:'Method not allowed'};

  try {
    const body = JSON.parse(event.body);
    const { imageBase64, mediaType, scene } = body;

    const scenes = {
      'Frente al Castillo de Cinderella': 'in front of Cinderella Castle at Magic Kingdom Disney World, pink and blue castle behind them, blue sky, colorful flags',
      'Show de fuegos artificiales': 'at Magic Kingdom watching fireworks, colorful fireworks above Cinderella Castle at night',
      'Main Street de noche': 'on Main Street USA at Disney World at night, festive lights, Disney shops on both sides',
      'Animal Kingdom': 'at Animal Kingdom Disney World, Tree of Life in background, lush tropical vegetation',
      'Hollywood Studios': 'at Hollywood Studios, Chinese Theatre in background, Hollywood Boulevard'
    };

    const sceneDesc = scenes[scene] || 'at Magic Kingdom Disney World in front of Cinderella Castle';
    const prompt = `Place the exact same people from this photo ${sceneDesc}. The family is wearing Disney merchandise and Mickey ears. Keep the people's faces exactly the same. Professional Disney park vacation photo, bright colors, magical festive atmosphere, high quality photography.`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mediaType, data: imageBase64 } },
              { text: prompt }
            ]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        })
      }
    );

    const data = await resp.json();
    console.log('Gemini status:', resp.status, JSON.stringify(data).substring(0,400));

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData);

    if(!imgPart?.inlineData?.data) {
      return {statusCode:500, body: JSON.stringify({error:'No image generated', detail: data})};
    }

    const mimeOut = imgPart.inlineData.mimeType || 'image/png';
    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
      body: JSON.stringify({
        imageBase64: `data:${mimeOut};base64,${imgPart.inlineData.data}`
      })
    };

  } catch(e) {
    console.log('Error:', e.message);
    return {statusCode:500, body: JSON.stringify({error: e.message})};
  }
};
