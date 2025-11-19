import express from 'express';
const router = express.Router();

// POST /api/translate
// Body: { text: string | string[], target: 'en'|'es'|... }
// Response: { translations: [ { input, translatedText, detectedSource } ] }
router.post('/', async (req, res, next) => {
  try {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Translation API not configured' });

    const { text, target = 'en' } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    // Call Google Translate v2 REST API. The API accepts q as a string or array.
    const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`;

    const payload = {
      q: text,
      target,
      format: 'text'
    };

    const fetchRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      return res.status(fetchRes.status).json({ error: 'Translate API error', details: errText });
    }

    const data = await fetchRes.json();

    // Normalize the response similar to other routes: ensure an array of results
    const translations = (data?.data?.translations || []).map((t, i) => ({
      input: Array.isArray(text) ? text[i] : text,
      translatedText: t.translatedText,
      detectedSource: t.detectedSourceLanguage || null
    }));

    res.json({ translations });
  } catch (error) {
    next(error);
  }
});

export default router;