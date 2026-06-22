import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextResponse } from 'next/server';

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

// In-memory rate limiter for serverless
const rateLimiter = new RateLimiterMemory({
  points: MAX_REQUESTS,
  duration: WINDOW_MS / 1000,
  blockDuration: WINDOW_MS / 1000, // Block for same duration
});

// Get client identifier (IP or custom header)
function getClientIdentifier(request: Request): string {
  // Check for forwarded header (for proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Check for real IP header (Nginx)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'unknown';
}

interface RateLimitInfo {
  remaining: number;
  reset: Date;
  limit: number;
}

export async function checkRateLimit(request: Request): Promise<{
  allowed: boolean;
  info: RateLimitInfo;
}> {
  const clientId = getClientIdentifier(request);
  const key = `rate-limit:${clientId}`;

  try {
    const result = await rateLimiter.consume(key);

    return {
      allowed: true,
      info: {
        remaining: result.remainingPoints,
        reset: new Date(Date.now() + result.msBeforeNext),
        limit: MAX_REQUESTS,
      },
    };
  } catch (error) {
    return {
      allowed: false,
      info: {
        remaining: 0,
        reset: new Date(Date.now() + WINDOW_MS),
        limit: MAX_REQUESTS,
      },
    };
  }
}

export function rateLimitResponse(info: RateLimitInfo): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((info.reset.getTime() - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': info.limit.toString(),
        'X-RateLimit-Remaining': info.remaining.toString(),
        'X-RateLimit-Reset': info.reset.toISOString(),
        'Retry-After': Math.ceil((info.reset.getTime() - Date.now()) / 1000).toString(),
      },
    }
  );
}

export function addRateLimitHeaders(
  response: NextResponse,
  info: RateLimitInfo
): NextResponse {
  response.headers.set('X-RateLimit-Limit', info.limit.toString());
  response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
  response.headers.set('X-RateLimit-Reset', info.reset.toISOString());
  return response;
}

// Wrapper for API routes
export async function withRateLimit(
  request: Request,
  handler: (request: Request) => Promise<NextResponse>
): Promise<NextResponse> {
  const { allowed, info } = await checkRateLimit(request);

  if (!allowed) {
    return rateLimitResponse(info);
  }

  const response = await handler(request);
  return addRateLimitHeaders(response, info);
}

// Create per-endpoint rate limiters
export function createEndpointLimiter(endpoint: string, maxRequests?: number) {
  return new RateLimiterMemory({
    points: maxRequests || MAX_REQUESTS,
    duration: WINDOW_MS / 1000,
    keyPrefix: `rate-limit:${endpoint}`,
  });
}
