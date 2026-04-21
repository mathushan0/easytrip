import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { verifyJWT, requireTier } from '../auth/middleware.js';
import { NotFoundError } from '../errors/index.js';
import { translateText, performOcr } from '../services/translate.js';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';
import { config } from '../config/index.js';
import { eq as eqDrizzle } from 'drizzle-orm';

const s3 = new S3Client({ region: config.aws.region });

const TranslateTextSchema = z.object({
  text: z.string().min(1).max(5000),
  target_lang: z.string().min(2).max(10),
  source_lang: z.string().min(2).max(10).optional(),
});

const OcrSchema = z.object({
  image_base64: z.string().min(1),
  target_lang: z.string().min(2).max(10),
});

const SavePhraseSchema = z.object({
  phrase_id: z.string().uuid().optional(),
  custom_phrase_en: z.string().optional(),
  custom_phrase_native: z.string().optional(),
  language_code: z.string().min(2),
});

export async function translatorRoutes(fastify: FastifyInstance) {
  // POST /translate/text
  fastify.post('/translate/text', { preHandler: [verifyJWT] }, async (request, reply) => {
    const body = TranslateTextSchema.parse(request.body);
    const result = await translateText(body.text, body.target_lang, body.source_lang);
    reply.send({ data: result });
  });

  // POST /translate/ocr [Voyager+]
  fastify.post(
    '/translate/ocr',
    { preHandler: [verifyJWT, requireTier('voyager')] },
    async (request, reply) => {
      const body = OcrSchema.parse(request.body);
      const result = await performOcr(body.image_base64, body.target_lang);
      reply.send({ data: result });
    },
  );

  // GET /translate/phrasebook
  fastify.get('/translate/phrasebook', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { language, category } = request.query as { language: string; category?: string };

    if (!language) {
      return reply.code(400).send({ error: 'validation_error', message: 'language required' });
    }

    const conditions = [eq(schema.phrasebookEntries.languageCode, language)];
    if (category) {
      conditions.push(
        eq(
          schema.phrasebookEntries.category,
          category as typeof schema.phrasebookEntries.$inferSelect['category'],
        ),
      );
    }

    const phrases = await db.query.phrasebookEntries.findMany({
      where: and(...conditions),
      limit: 200,
    });

    reply.send({ data: phrases });
  });

  // GET /translate/phrasebook/:phraseId/audio [Voyager+]
  fastify.get(
    '/translate/phrasebook/:phraseId/audio',
    { preHandler: [verifyJWT, requireTier('voyager')] },
    async (request, reply) => {
      const { phraseId } = request.params as { phraseId: string };

      const phrase = await db.query.phrasebookEntries.findFirst({
        where: eq(schema.phrasebookEntries.id, phraseId),
      });

      if (!phrase) throw new NotFoundError('Phrase');

      // Return cached audio if available
      if (phrase.audioUrl) {
        return reply.redirect(phrase.audioUrl);
      }

      // Generate audio via Google Cloud TTS
      const ttsResponse = await axios.post(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.google.ttsApiKey}`,
        {
          input: { text: phrase.phraseNative },
          voice: {
            languageCode: phrase.languageCode,
            ssmlGender: 'NEUTRAL',
          },
          audioConfig: { audioEncoding: 'MP3' },
        },
      );

      const audioBuffer = Buffer.from(ttsResponse.data.audioContent, 'base64');
      const s3Key = `phrases/${phrase.languageCode}/${phraseId}.mp3`;

      await s3.send(
        new PutObjectCommand({
          Bucket: config.aws.s3BucketName,
          Key: s3Key,
          Body: audioBuffer,
          ContentType: 'audio/mpeg',
          CacheControl: 'max-age=31536000',
        }),
      );

      const audioUrl = `https://${config.aws.cloudfrontDomain}/${s3Key}`;

      await db
        .update(schema.phrasebookEntries)
        .set({ audioUrl, audioGeneratedAt: new Date() })
        .where(eq(schema.phrasebookEntries.id, phraseId));

      reply.redirect(audioUrl);
    },
  );

  // POST /translate/saved [Voyager+]
  fastify.post(
    '/translate/saved',
    { preHandler: [verifyJWT, requireTier('voyager')] },
    async (request, reply) => {
      const body = SavePhraseSchema.parse(request.body);

      const [saved] = await db
        .insert(schema.savedPhrases)
        .values({
          userId: request.userId,
          phraseId: body.phrase_id,
          customPhraseEn: body.custom_phrase_en,
          customPhraseNative: body.custom_phrase_native,
          languageCode: body.language_code,
        })
        .returning();

      reply.code(201).send({ data: saved });
    },
  );

  // GET /translate/saved [Voyager+]
  fastify.get(
    '/translate/saved',
    { preHandler: [verifyJWT, requireTier('voyager')] },
    async (request, reply) => {
      const { language } = request.query as { language?: string };

      const conditions = [eq(schema.savedPhrases.userId, request.userId)];
      if (language) conditions.push(eq(schema.savedPhrases.languageCode, language));

      const saved = await db.query.savedPhrases.findMany({
        where: and(...conditions),
        with: { phrase: true },
        orderBy: [schema.savedPhrases.createdAt],
      });

      reply.send({ data: saved });
    },
  );
}
