import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const timestampSchema = z.string().datetime();

export const dateSchema = z.string().date();

export const confidenceScoreSchema = z.number().min(0).max(1);

export const proficiencyLevelSchema = z.number().int().min(1).max(5);
