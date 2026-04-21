import type { UserTier } from '../types/index.js';

// ── Base error ────────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ── Auth errors ───────────────────────────────────────────────────────────────

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'unauthorized');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'forbidden');
  }
}

// ── Tier / upgrade errors ─────────────────────────────────────────────────────

export class UpgradeRequiredError extends AppError {
  constructor(
    public readonly requiredTier: UserTier,
    public readonly upsellContext?: string,
  ) {
    super(`Upgrade to ${requiredTier} required`, 403, 'upgrade_required');
  }
}

// ── Resource errors ───────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'not_found');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'conflict');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'validation_error');
  }
}

// ── External service errors ───────────────────────────────────────────────────

export class AIGenerationError extends AppError {
  constructor(message = 'AI generation failed') {
    super(message, 503, 'ai_generation_failed');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'rate_limit_exceeded');
  }
}

// ── Error serialiser for Fastify ──────────────────────────────────────────────

export function serializeError(err: AppError) {
  const body: Record<string, unknown> = {
    error: err.code ?? 'error',
    message: err.message,
  };

  if (err instanceof UpgradeRequiredError) {
    body.required_tier = err.requiredTier;
    if (err.upsellContext) body.upsell_context = err.upsellContext;
  }

  return body;
}
