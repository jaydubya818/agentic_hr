import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { writeErrorResponse } from './write-error-response';

describe('writeErrorResponse', () => {
  it('maps Zod validation failures to 400 with the first issue message', async () => {
    const result = z.object({ title: z.string().min(1, 'Title is required') }).safeParse({ title: '' });
    expect(result.success).toBe(false);
    const response = writeErrorResponse(result.success ? null : result.error);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Title is required' });
  });

  it('maps malformed JSON (SyntaxError) to 400 without echoing details', async () => {
    let caught: unknown;
    try {
      JSON.parse('{nope');
    } catch (error) {
      caught = error;
    }
    const response = writeErrorResponse(caught);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid JSON body' });
  });

  it('maps service Forbidden errors to 403', async () => {
    const response = writeErrorResponse(new Error('Forbidden'));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });

  it('maps known scope-validation messages to 400', async () => {
    const response = writeErrorResponse(new Error('Unknown team for this organization'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Unknown team for this organization' });
  });

  it('re-throws unexpected errors so internal text never reaches the client', () => {
    const internal = new Error('connect ECONNREFUSED 127.0.0.1:5432');
    expect(() => writeErrorResponse(internal)).toThrow(internal);
  });
});
