import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Scope-validation messages that services intentionally surface to callers.
 * Anything outside this list (and the cases below) is an internal failure and
 * must not be echoed back to the client.
 */
const CLIENT_SAFE_BAD_REQUEST_MESSAGES = new Set([
  'Unknown team for this organization',
  'Unknown owner for this organization',
  'Unknown employee for this organization',
]);

/**
 * Map errors thrown by write-route bodies to HTTP responses:
 * - Zod validation failures → 400 with the first issue message
 * - malformed JSON bodies → 400
 * - service scope denials ("Forbidden") → 403
 * - known scope-validation messages → 400
 * Unexpected errors are re-thrown so they surface as 500s without leaking
 * internal error text in the response body.
 */
export function writeErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Invalid request body' },
      { status: 400 },
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (error instanceof Error && error.message === 'Forbidden') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (error instanceof Error && CLIENT_SAFE_BAD_REQUEST_MESSAGES.has(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  throw error;
}
