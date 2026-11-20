import { describe, expect, it } from 'vitest';
import {
  CITIES,
  buildCustomCity,
  computeBioDose,
  decodeWeatherCode,
  generateGuidance,
  getAqiMeta,
} from './airQuality';

describe('getAqiMeta', () => {
  it('maps AQI values to the expected categories', () => {
    expect(getAqiMeta(35).label).toBe('Good');
    expect(getAqiMeta(85).label).toBe('Satisfactory');
    expect(getAqiMeta(150).label).toBe('Moderate');
    expect(getAqiMeta(250).label).toBe('Poor');
    expect(getAqiMeta(350).label).toBe('Very Poor');
    expect(getAqiMeta(450).label).toBe('Severe');
  });
});

describe('decodeWeatherCode', () => {
  it('decodes WMO weather codes into human-readable labels', () => {
    expect(decodeWeatherCode(0)).toBe('Clear Sky');
    expect(decodeWeatherCode(45)).toBe('Haze / Fog');
    expect(decodeWeatherCode(61)).toBe('Light Rain');
    expect(decodeWeatherCode(95)).toBe('Thunderstorm');
  });
});

describe('computeBioDose', () => {
  it('computes lower bio-dose with HEPA and active PM2.5 swaps', () => {
    const delhi = CITIES[0];
    const sensitive = computeBioDose(
      delhi,
      {
        members: ['Kids', 'Asthma / Sensitive'],
        commute: 'Two-Wheeler',
        indoor: ['Natural Ventilation'],
      },
      0
    );
    const protectedFamily = computeBioDose(
      delhi,
      {
        members: ['Kids'],
        commute: 'Metro / Public',
        indoor: ['HEPA Purifier'],
      },
      44
    );

    expect(protectedFamily.adjustedDoseUg).toBeLessThan(sensitive.adjustedDoseUg);
    expect(protectedFamily.preventedUg).toBeGreaterThan(0);
    expect(protectedFamily.safeWindow).toBe('Indoors Only (HEPA On)');
  });
});

describe('generateGuidance', () => {
  it('returns an HRL Smart Engine plan when no Gemini API key is provided', async () => {
    const plan = await generateGuidance(CITIES[0], {
      members: ['Kids'],
      commute: 'Metro / Public',
      indoor: ['HEPA Purifier'],
    });

    expect(plan.source).toBe('hrl-engine');
    expect(plan.routine).toHaveLength(3);
    expect(plan.indoorHacks.length).toBeGreaterThanOrEqual(4);
  });
});

describe('buildCustomCity', () => {
  it('builds a deterministic CityAQI fallback with valid coordinates', () => {
    const city = buildCustomCity('Mangaluru');
    expect(city.name).toBe('Mangaluru');
    expect(city.aqi).toBeGreaterThanOrEqual(95);
    expect(city.lat).toBeGreaterThan(0);
    expect(city.lon).toBeGreaterThan(0);
  });
});
