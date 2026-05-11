exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return {statusCode:405,body:'Method not allowed'};

  try {
    const body = JSON.parse(event.body);
    const { imageBase64, mediaType, scene } = body;

    const sceneDescriptions = {
      'Frente al Castillo de Cinderella': 'in front of Cinderella Castle at Magic Kingdom Disney World, with the iconic pink and blue castle behind them, colorful flags, green trees, blue sky',
      'Show de fuegos artificiales': 'at Magic Kingdom Disney World watching fireworks, colorful fireworks exploding in the night sky above Cinderella Castle, crowds of happy people',
      'Main Street de noche': 'on Main Street USA at Disney World at night, colorful lights and decorations, Disney shops and buildings on both sides, festive atmosphere',
      'Animal Kingdom': 'at Animal Kingdom Disney World, with the Tree of Life in the background, lush tropical vegetation, Disney park atmosphere',
      'Hollywood Studios': 'at Hollywood Studios Disney World, with the Chinese Theatre in the background, Hollywood Boulevard, Disney park atmosphere'
    };

    const sceneDesc = sceneDescriptions[scene] || 'at Disney World Magic Kingdom, with Cinderella Castle in the background';

    const prompt = `Family vacation photo at Disney World. The family from the reference photo is now ${sceneDesc}. Mickey Mouse and Minnie Mouse are posing with them. Everyone is smiling and happy. Professional Disney park photography, bright colors, magical atmosphere, high quality JPEG photo.`;

    const falResp = await fetch('https://fal.run/fal-ai/flux-kontext-pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${process.env.FAL_KEY}`
      },
      body: JSON.stringify({
        prompt: prompt,
        image_url: `data:${mediaType};base64,${imageBase64}`,
        num_images: 1,
        output_format: 'jpeg',
        guidance_scale: 5,
        num_inference_steps: 35
      })
    });

    const data = await falResp.json();
    console.log('fal status:', falResp.status, 'keys:', Object.keys(data));

    if(!data.images || !data.images[0]) {
      return {statusCode:500, body: JSON.stringify({error:'No image', detail: data})};
    }

    const imgUrl = data.images[0].url;
    const imgResp = await fetch(imgUrl);
    const imgBuffer = await imgResp.arrayBuffer();
    const imgBase64 = Buffer.from(imgBuffer).toString('base64');

    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
      body: JSON.stringify({ imageBase64: `data:image/jpeg;base64,${imgBase64}` })
    };

  } catch(e) {
    console.log('Error:', e.message);
    return {statusCode:500, body: JSON.stringify({error: e.message})};
  }
};
