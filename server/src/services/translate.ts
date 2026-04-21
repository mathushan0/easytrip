import axios from 'axios';
import { config } from '../config/index.js';
import { redis } from '../plugins/redis.js';
import crypto from 'crypto';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashText(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex').slice(0, 16);
}

// ── Google Translate ──────────────────────────────────────────────────────────

export interface TranslationResult {
  text: string;
  source_lang: string;
}

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<TranslationResult> {
  const cacheKey = `translate:${hashText(text)}:${sourceLang ?? 'auto'}:${targetLang}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const params: Record<string, string> = {
      q: text,
      target: targetLang,
      key: config.google.translateApiKey,
      format: 'text',
    };
    if (sourceLang) params.source = sourceLang;

    const response = await axios.post(
      'https://translation.googleapis.com/language/translate/v2',
      null,
      { params },
    );

    const translation = response.data.data.translations[0];
    const result: TranslationResult = {
      text: translation.translatedText,
      source_lang: translation.detectedSourceLanguage ?? sourceLang ?? 'unknown',
    };

    await redis.setex(cacheKey, 86400, JSON.stringify(result));
    return result;
  } catch (primaryErr) {
    // Fallback to LibreTranslate
    return libreTranslateFallback(text, sourceLang ?? 'auto', targetLang);
  }
}

async function libreTranslateFallback(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationResult> {
  const response = await axios.post(`${config.libreTranslate.url}/translate`, {
    q: text,
    source: sourceLang,
    target: targetLang,
    format: 'text',
  });

  return {
    text: response.data.translatedText,
    source_lang: sourceLang,
  };
}

// ── Google Cloud Vision OCR ───────────────────────────────────────────────────

export interface OcrBlock {
  text: string;
  translated: string;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface OcrResult {
  detected_text: string;
  translated_text: string;
  language_detected: string;
  blocks: OcrBlock[];
}

export async function performOcr(
  imageBase64: string,
  targetLang: string,
): Promise<OcrResult> {
  const response = await axios.post(
    `https://vision.googleapis.com/v1/images:annotate?key=${config.google.visionApiKey}`,
    {
      requests: [
        {
          image: { content: imageBase64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        },
      ],
    },
  );

  const annotation = response.data.responses[0];
  if (!annotation?.fullTextAnnotation) {
    return {
      detected_text: '',
      translated_text: '',
      language_detected: 'unknown',
      blocks: [],
    };
  }

  const detectedText = annotation.fullTextAnnotation.text;
  const langDetected = annotation.textAnnotations?.[0]?.locale ?? 'unknown';

  // Extract individual blocks
  const blocks: OcrBlock[] = await Promise.all(
    (annotation.fullTextAnnotation.pages?.[0]?.blocks ?? []).map(
      async (block: Record<string, unknown>) => {
        const paragraphText = (block.paragraphs as Array<{
          words: Array<{ symbols: Array<{ text: string }> }>;
        }>)
          ?.map((para) =>
            para.words
              .map((word) => word.symbols.map((sym) => sym.text).join(''))
              .join(' '),
          )
          .join('\n');

        let translated = paragraphText;
        try {
          const t = await translateText(paragraphText, targetLang, langDetected);
          translated = t.text;
        } catch { /* keep original */ }

        return {
          text: paragraphText,
          translated,
        };
      },
    ),
  );

  const { text: translatedText } = await translateText(detectedText, targetLang, langDetected);

  return {
    detected_text: detectedText,
    translated_text: translatedText,
    language_detected: langDetected,
    blocks,
  };
}

// ── Get exchange rates ────────────────────────────────────────────────────────

export async function getExchangeRates(base = 'GBP'): Promise<Record<string, number>> {
  const cacheKey = `exchange_rates:${base}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const response = await axios.get(
    `https://openexchangerates.org/api/latest.json?app_id=${config.openExchangeRates.appId}&base=${base}`,
  );

  const rates = response.data.rates as Record<string, number>;
  await redis.setex(cacheKey, 3600, JSON.stringify(rates)); // 1h TTL
  return rates;
}
