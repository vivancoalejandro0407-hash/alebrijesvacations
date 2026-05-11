exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return {statusCode:405,body:'Method not allowed'};

  try {
    const body = JSON.parse(event.body);
    const { imageBase64, mediaType, scene } = body;

    const sceneDescriptions = {
      'Frente al Castillo de Cinderella': 'in front of Cinderella Castle at Magic Kingdom Disney World. The iconic blue and pink castle is clearly visible behind them. Blue sky, green trees, colorful Disney flags.',
      'Show de fuegos artificiales': 'at Magic Kingdom Disney World watching a spectacular fireworks show. Colorful fireworks exploding in the night sky above Cinderella Castle.',
      'Main Street de noche': 'on Main Street USA at Disney World at night. Festive lights and colorful decorations everywhere. Disney shops and Victorian buildings on both sides of the street.',
      'Animal Kingdom': 'at Animal Kingdom Disney World. The iconic Tree of Life is visible in the background. Lush tropical vegetation and Disney park atmosphere.',
      'Hollywood Studios': 'at Hollywood Studios Disney World. The Chinese Theatre is in the background. Hollywood Boulevard with Disney park decorations.'
    };

    const sceneDesc = sceneDescriptions[scene] || 'at Magic Kingdom Disney World in front of Cinderella Castle';

    // Correct endpoint for flux-pro kontext
    const falResp = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${process.env.FAL_KEY}`
      },
      body: JSON.stringify({
        prompt: `Place the exact same people from this photo ${sceneDesc}. Mickey Mouse and Minnie Mouse are standing next to them, posing for the photo. Keep the people's faces and appearance exactly the same. Professional Disney vacation photo, bright colors, magical atmosphere, high quality.`,
        image_url: `data:${mediaType};base64,${imageBase64}`,
        num_images: 1,
        output_format: 'jpeg',
        guidance_scale: 4,
        num_inference_steps: 28,
        safety_tolerance: '2'
      })
    });

    const data = await falResp.json();
    console.log('fal status:', falResp.status, JSON.stringify(data).substring(0,300));

    if(!data.images || !data.images[0] || !data.images[0].url) {
      return {statusCode:500, body: JSON.stringify({error:'No image', raw: data})};
    }

    // Fetch image and return as base64 to avoid CORS issues in browser
    const imgResp = await fetch(data.images[0].url);
    const imgBuffer = await imgResp.arrayBuffer();
    const b64 = Buffer.from(imgBuffer).toString('base64');

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
