export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY is not configured on the server.' });

  const body = req.body || {};

  // Build conversation turns from either a messages array (multi-turn) or a single prompt.
  let contents = [];
  if (Array.isArray(body.messages)) {
    contents = body.messages
      .filter((m) => m && typeof m.text === 'string' && m.text.trim())
      .map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text.trim() }],
      }));
  } else if (typeof body.prompt === 'string' && body.prompt.trim()) {
    contents = [{ role: 'user', parts: [{ text: body.prompt.trim() }] }];
  }

  if (contents.length === 0) return res.status(400).json({ error: 'A prompt or messages array is required.' });

  const payload = {
    contents,
    generationConfig: { temperature: 0.5 },
  };

  if (typeof body.systemInstruction === 'string' && body.systemInstruction.trim()) {
    payload.systemInstruction = { parts: [{ text: body.systemInstruction.trim() }] };
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return res.status(response.status).json({ error: `Gemini API error: ${response.status}` });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return res.status(502).json({ error: 'Gemini response was empty.' });

    return res.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
