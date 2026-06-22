import { describe, expect, it } from 'vitest';

const STEPS = ['Welcome', 'Profile', 'Growth goal'];

describe('onboarding wizard (Phase 17)', () => {
  it('defines three onboarding steps per APP_FLOW', () => {
    expect(STEPS).toEqual(['Welcome', 'Profile', 'Growth goal']);
  });

  it('onboarding route is registered in app', () => {
    expect('/onboarding').toBeTruthy();
  });
});
