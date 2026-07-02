import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const apiKey = process.env.GOOGLE_API_KEY;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/gemini', async (req, res) => {
  try {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';

    if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY is not configured on the server.' });
    if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
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
});

// Serve built static assets
app.use(express.static(distPath));
// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

http.createServer(app).listen(port, () => {
  console.log(`App + Gemini proxy listening on http://localhost:${port}`);
});
