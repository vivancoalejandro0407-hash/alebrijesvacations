exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return {statusCode:405,body:'Method not allowed'};

  try {
    const body = JSON.parse(event.body);
    const { imageBase64, mediaType, scene } = body;

    // Use flux-kontext which is best for image editing/compositing
    const prompt = `Take the people from this photo and place them inside ${scene} at Disney World. They should be standing together smiling, surrounded by Mickey Mouse, Minnie Mouse, Donald Duck and Goofy. Disney World park setting, magical atmosphere, colorful balloons and castle in background, professional photography, bright cheerful lighting.`;

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
        guidance_scale: 4.5,
        num_inference_steps: 30
      })
    });

    const data = await falResp.json();
    console.log('fal response:', JSON.stringify(data).substring(0,300));

    if(!data.images || !data.images[0]) {
      return {statusCode:500, body: JSON.stringify({error:'No image generated', detail: data})};
    }

    // Fetch image and return as base64 to avoid CORS
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
