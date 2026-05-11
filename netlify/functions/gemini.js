exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return {statusCode:405,body:'Method not allowed'};

  try {
    const body = JSON.parse(event.body);
    const { imageBase64, mediaType, scene } = body;

    const sceneDescriptions = {
      'Frente al Castillo de Cinderella': 'in front of Cinderella Castle at Magic Kingdom Disney World. The iconic pink and blue castle is clearly visible behind them. Blue sky, green trees, colorful Disney flags.',
      'Show de fuegos artificiales': 'at Magic Kingdom Disney World watching fireworks. Colorful fireworks exploding in the night sky above Cinderella Castle.',
      'Main Street de noche': 'on Main Street USA at Disney World at night. Festive lights everywhere, Disney shops on both sides.',
      'Animal Kingdom': 'at Animal Kingdom Disney World. The iconic Tree of Life visible in background. Lush tropical vegetation.',
      'Hollywood Studios': 'at Hollywood Studios Disney World. The Chinese Theatre in the background. Hollywood Boulevard.'
    };

    const sceneDesc = sceneDescriptions[scene] || 'at Magic Kingdom Disney World in front of Cinderella Castle';

    const prompt = `This is a family photo. Place these exact same people ${sceneDesc}. Mickey Mouse and Minnie Mouse are standing next to them smiling. Keep the people's faces exactly the same. Professional Disney vacation photo, bright colors, magical atmosphere.`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: mediaType,
                  data: imageBase64
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            responseMimeType: 'image/jpeg'
          }
        })
      }
    );

    const data = await resp.json();
    console.log('Gemini status:', resp.status, JSON.stringify(data).substring(0,300));

    // Extract image from response
    const parts = data?.candidates?.[0]?.content?.parts;
    const imgPart = parts?.find(p => p.inlineData);

    if(!imgPart) {
      return {statusCode:500, body: JSON.stringify({error:'No image generated', detail: data})};
    }

    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
      body: JSON.stringify({
        imageBase64: `data:image/jpeg;base64,${imgPart.inlineData.data}`
      })
    };

  } catch(e) {
    console.log('Error:', e.message);
    return {statusCode:500, body: JSON.stringify({error: e.message})};
  }
};
