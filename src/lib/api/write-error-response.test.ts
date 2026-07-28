import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { writeErrorResponse } from './write-error-response';

function captureZodError(): unknown {
  try {
    z.object({ title: z.string().min(1, 'Title is required') }).parse({ title: '' });
  } catch (error) {
    return error;
  }
  throw new Error('expected parse to fail');
}

describe('writeErrorResponse', () => {
  it('maps zod failures to 400 with the first issue message only', async () => {
    const response = writeErrorResponse(captureZodError());
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('Title is required');
  });

  it('maps malformed JSON bodies to a generic 400', async () => {
    const response = writeErrorResponse(
      new SyntaxError('Unexpected token < in JSON at position 0'),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('Invalid JSON body');
  });

  it('maps service scope denials to 403', async () => {
    const response = writeErrorResponse(new Error('Forbidden'));
    expect(response.status).toBe(403);
  });

  it('passes through known scope-validation messages as 400', async () => {
    const response = writeErrorResponse(new Error('Unknown team for this organization'));
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('Unknown team for this organization');
  });

  it('rethrows unexpected errors instead of echoing them to the client', () => {
    const internal = new Error('connect ECONNREFUSED 127.0.0.1:5432');
    expect(() => writeErrorResponse(internal)).toThrow(internal);
  });
});
