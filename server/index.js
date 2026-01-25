import http from 'http';

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const apiKey = process.env.GOOGLE_API_KEY;

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: 'Missing request URL' });
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/gemini') {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  if (!apiKey) {
    sendJson(res, 500, { error: 'GOOGLE_API_KEY is not configured on the server.' });
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body || '{}');
      const prompt = typeof parsed.prompt === 'string' ? parsed.prompt.trim() : '';

      if (!prompt) {
        sendJson(res, 400, { error: 'Prompt is required.' });
        return;
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
          },
        }),
      });

      if (!response.ok) {
        sendJson(res, response.status, { error: `Gemini API error: ${response.status}` });
        return;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!text) {
        sendJson(res, 502, { error: 'Gemini response was empty.' });
        return;
      }

      sendJson(res, 200, { text });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      sendJson(res, 500, { error: message });
    }
  });
});

server.listen(port, () => {
  console.log(`Gemini proxy listening on http://localhost:${port}`);
});
