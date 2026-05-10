exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return {statusCode:405,body:'Method not allowed'};

  try {
    const body = JSON.parse(event.body);
    const { imageBase64, mediaType, scene } = body;

    // Call fal.ai - flux-kontext for image editing/compositing
    const prompt = `Professional Disney World photo. A happy family is posing together with Mickey Mouse, Minnie Mouse, Donald Duck and Goofy in front of ${scene}. The family looks excited and joyful. Magic kingdom atmosphere, colorful, high quality, photorealistic, Disney park lighting.`;

    const resp = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
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
        guidance_scale: 3.5,
        num_inference_steps: 28,
        safety_tolerance: '2'
      })
    });

    const data = await resp.json();

    if(data.images && data.images[0]) {
      return {
        statusCode: 200,
        headers: {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
        body: JSON.stringify({ imageUrl: data.images[0].url })
      };
    } else {
      return {statusCode:500, body: JSON.stringify({error:'No image generated', detail: data})};
    }
  } catch(e) {
    return {statusCode:500, body: JSON.stringify({error: e.message})};
  }
};
