import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { config } from '../config/index.js';
import { AIGenerationError } from '../errors/index.js';
import type { GenerationContext, Prompt } from '../types/index.js';

// ── Clients ───────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: config.ai.anthropicApiKey });
const openai = new OpenAI({ apiKey: config.ai.openaiApiKey });

// ── Output Zod Schema ─────────────────────────────────────────────────────────

const TaskOutputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['food', 'landmark', 'transport', 'culture', 'budget', 'accommodation', 'general']),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration_minutes: z.number().int().positive().optional(),
  venue_name: z.string().optional(),
  venue_address: z.string().optional(),
  google_place_id: z.string().optional(),
  estimated_cost: z.number().nonnegative().optional(),
  travel_time_to_next_minutes: z.number().int().nonnegative().optional(),
  transport_mode: z.enum(['walk', 'metro', 'bus', 'taxi', 'bike']).optional(),
  tips: z.string().optional(),
});

const DayOutputSchema = z.object({
  day_number: z.number().int().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  tasks: z.array(TaskOutputSchema).min(3).max(12),
});

export const ItineraryOutputSchema = z.object({
  destination_confidence: z.enum(['high', 'medium', 'low']),
  confidence_note: z.string().optional(),
  days: z.array(DayOutputSchema).min(1),
  estimated_total_cost: z.number().nonnegative(),
  currency: z.string().length(3),
  ai_tips: z.array(z.string()).max(5),
});

export type ItineraryOutput = z.infer<typeof ItineraryOutputSchema>;

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are EasyTrip's AI travel planner. Generate a detailed, day-by-day travel itinerary.

RULES:
- Return ONLY valid JSON matching the schema below. No markdown, no prose, no code fences.
- Use local time for all times (HH:MM format).
- Include realistic travel times between venues.
- Suggest real venues. You will be given confirmed venues to use where relevant.
- Match the user's budget tier, dietary requirements, and interests precisely.
- Include peak hour warnings in task descriptions where relevant.
- Provide a destination_confidence field: "high" | "medium" | "low".
- If confidence is "low", include a confidence_note explaining limitations.
- estimated_total_cost should reflect realistic total spend in the given currency.
- ai_tips: 3-5 practical insider tips for the destination.

OUTPUT SCHEMA:
${JSON.stringify(zodToJsonSchema(ItineraryOutputSchema, 'ItineraryOutput'), null, 2)}`;

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildUserPrompt(ctx: GenerationContext): string {
  return `Generate a ${ctx.durationDays}-day itinerary for ${ctx.destination}.

TRIP DETAILS:
- Dates: ${ctx.startDate} to ${ctx.endDate} (${ctx.timezone})
- Traveller type: ${ctx.tripType}
- Budget tier: ${ctx.budgetTier} (total budget: ${ctx.budgetAmount} ${ctx.currency})
- Interests: ${ctx.interests.join(', ') || 'general sightseeing'}
- Dietary requirements: ${ctx.dietary.join(', ') || 'none'}
- Pace preference: ${ctx.pace}

WEATHER FORECAST:
${JSON.stringify(ctx.weatherForecast, null, 2)}

CONFIRMED VENUES (use these where relevant, you may add others):
${JSON.stringify(ctx.confirmedVenues.slice(0, 20), null, 2)}

TRANSPORT PASSES AVAILABLE:
${JSON.stringify(ctx.transportPasses, null, 2)}

LOCAL DISHES TO FEATURE:
${ctx.localDishes.join(', ')}

Generate the full ${ctx.durationDays}-day itinerary. Be specific. Include opening times, costs, and how to get there.`;
}

// ── LLMClient ─────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise
      .then((val) => { clearTimeout(timer); resolve(val); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const message = await withTimeout(
    anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    }),
    TIMEOUT_MS,
  );

  const text = message.content[0];
  if (text.type !== 'text') throw new Error('Unexpected Claude response type');

  return JSON.parse(text.text);
}

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const completion = await withTimeout(
    openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 8192,
    }),
    TIMEOUT_MS,
  );

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty OpenAI response');

  return JSON.parse(content);
}

// ── Main generation function ──────────────────────────────────────────────────

export async function generateItinerary(ctx: GenerationContext): Promise<ItineraryOutput> {
  const systemPrompt = SYSTEM_PROMPT;
  const userPrompt = buildUserPrompt(ctx);

  const providers: Array<{ name: string; fn: () => Promise<unknown> }> = [
    { name: 'claude', fn: () => callClaude(systemPrompt, userPrompt) },
    { name: 'openai', fn: () => callOpenAI(systemPrompt, userPrompt) },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const raw = await provider.fn();
        const parsed = ItineraryOutputSchema.safeParse(raw);

        if (parsed.success) {
          return parsed.data;
        }

        errors.push(`${provider.name} attempt ${attempt}: Zod validation failed — ${parsed.error.message}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${provider.name} attempt ${attempt}: ${msg}`);

        // Exponential backoff on retry
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }
  }

  throw new AIGenerationError(`All AI providers failed: ${errors.join('; ')}`);
}

// ── Trip Assistant (chat) ─────────────────────────────────────────────────────

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateAssistantReply(
  messages: AssistantMessage[],
  tripContext: string,
): Promise<{ content: string; modelUsed: string; tokenCount: number }> {
  const systemPrompt = `You are EasyTrip's AI travel assistant. You are helping a traveller with their trip.
  
Trip context:
${tripContext}

Be concise, helpful, and specific. Use local knowledge. Answer in the user's language if possible.`;

  try {
    const message = await withTimeout(
      anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
      TIMEOUT_MS,
    );

    const text = message.content[0];
    if (text.type !== 'text') throw new Error('Unexpected Claude response type');

    return {
      content: text.text,
      modelUsed: 'claude-3-5-haiku-20241022',
      tokenCount: message.usage.input_tokens + message.usage.output_tokens,
    };
  } catch {
    // Fallback to GPT-4o mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    return {
      content,
      modelUsed: 'gpt-4o-mini',
      tokenCount: completion.usage?.total_tokens ?? 0,
    };
  }
}

// ── Social extraction (GPT-4o mini) ──────────────────────────────────────────

const ExtractedPostSchema = z.object({
  venue_name: z.string().nullable(),
  city: z.string().nullable(),
  country_code: z.string().length(2).nullable(),
  destination: z.string().nullable(),
  content_snippet: z.string().max(300).nullable(),
  content_type: z.enum(['influencer_pick', 'pricing_intel', 'travel_tip', 'hidden_gem', 'warning', 'general']).nullable(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).nullable(),
  extraction_confidence: z.enum(['high', 'medium', 'low']),
});

export type ExtractedPostData = z.infer<typeof ExtractedPostSchema>;

export async function extractSocialPost(rawContent: string): Promise<ExtractedPostData | null> {
  const prompt = `Extract travel information from this social media post. Return ONLY JSON matching the schema.
If no travel venue is mentioned, return null for venue_name.

Schema:
${JSON.stringify(zodToJsonSchema(ExtractedPostSchema), null, 2)}

Post content:
${rawContent.slice(0, 2000)}`;

  try {
    const completion = await withTimeout(
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a travel content extractor. Return ONLY valid JSON. No prose.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
      }),
      15_000,
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = ExtractedPostSchema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
