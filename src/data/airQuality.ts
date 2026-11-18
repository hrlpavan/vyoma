export interface HourlyPoint {
  time: string;
  temp: number;
  isDay: boolean;
  code: number;
}

export interface WeatherForecast {
  temp: number;
  high: number;
  low: number;
  condition: string;
  isDay: boolean;
  code: number;
  hourly: HourlyPoint[];
}

export interface CityAQI {
  name: string;
  lat: number;
  lon: number;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  condition: string;
  smogNote: string;
}

export interface HouseholdProfile {
  members: string[];
  commute: string;
  indoor: string[];
}

export interface SustainableSwap {
  id: string;
  title: string;
  from: string;
  to: string;
  pm25ReductionPct: number;
  co2SavedKgPerWeek: number;
  impactExplanation: string;
}

export interface GuidancePlan {
  source: 'gemini' | 'hrl-engine';
  summary: string;
  routine: {
    time: string;
    action: string;
    why: string;
  }[];
  indoorHacks: string[];
}

export const CITIES: CityAQI[] = [
  {
    name: 'Delhi NCR',
    lat: 28.6139,
    lon: 77.209,
    aqi: 368,
    pm25: 214,
    pm10: 342,
    no2: 68,
    o3: 41,
    condition: 'Very Poor',
    smogNote: 'Severe winter inversion trapping PM2.5 near ground level.',
  },
  {
    name: 'Lucknow',
    lat: 26.8467,
    lon: 80.9462,
    aqi: 294,
    pm25: 158,
    pm10: 248,
    no2: 52,
    o3: 38,
    condition: 'Poor',
    smogNote: 'Dense morning haze; avoid outdoor exertion before 10:30 AM.',
  },
  {
    name: 'Kolkata',
    lat: 22.5726,
    lon: 88.3639,
    aqi: 226,
    pm25: 112,
    pm10: 189,
    no2: 49,
    o3: 35,
    condition: 'Poor',
    smogNote: 'Elevated evening particulates from traffic & biomass.',
  },
  {
    name: 'Mumbai',
    lat: 19.076,
    lon: 72.8777,
    aqi: 154,
    pm25: 68,
    pm10: 132,
    no2: 44,
    o3: 46,
    condition: 'Moderate',
    smogNote: 'Coastal breeze helps dispersion; construction dust persists.',
  },
  {
    name: 'Pune',
    lat: 18.5204,
    lon: 73.8567,
    aqi: 118,
    pm25: 46,
    pm10: 94,
    no2: 33,
    o3: 39,
    condition: 'Moderate',
    smogNote: 'Mild morning mist; generally safe with basic precautions.',
  },
  {
    name: 'Bengaluru',
    lat: 12.9716,
    lon: 77.5946,
    aqi: 78,
    pm25: 26,
    pm10: 58,
    no2: 29,
    o3: 34,
    condition: 'Satisfactory',
    smogNote: 'Good dispersion today; ideal window for cross-ventilation.',
  },
];

export const SUSTAINABLE_SWAPS: SustainableSwap[] = [
  {
    id: 'commute-metro',
    title: 'Shift Solo Car to Metro / EV Pool',
    from: 'Solo Petrol Car',
    to: 'Metro / Shared EV',
    pm25ReductionPct: 28,
    co2SavedKgPerWeek: 18.4,
    impactExplanation:
      'Cuts tailpipe NO₂ and brake-dust PM2.5 along congested corridors while reducing your personal inhalation dose in traffic.',
  },
  {
    id: 'induction-cook',
    title: 'Use Induction + Chimney Exhaust',
    from: 'Open Gas Flame',
    to: 'Induction + Exhaust',
    pm25ReductionPct: 22,
    co2SavedKgPerWeek: 6.2,
    impactExplanation:
      'Eliminates indoor NO₂ spikes and ultrafine cooking aerosols that otherwise linger for hours in closed winter rooms.',
  },
  {
    id: 'no-incense',
    title: 'Replace Incense & Candles with HEPA',
    from: 'Daily Incense / Candles',
    to: 'HEPA + Indoor Plants',
    pm25ReductionPct: 19,
    co2SavedKgPerWeek: 1.5,
    impactExplanation:
      'Burning one incense stick in a closed room can spike indoor PM2.5 above 300 µg/m³—worse than outdoor winter smog.',
  },
  {
    id: 'smart-vent',
    title: 'Time Ventilation to Midday Window',
    from: 'Morning Window Opening',
    to: '1:00 PM – 4:00 PM Venting',
    pm25ReductionPct: 16,
    co2SavedKgPerWeek: 0.8,
    impactExplanation:
      'Winter thermal inversion breaks around midday, letting you flush indoor CO₂ when outdoor PM2.5 is at its daily lowest.',
  },
];

export interface BioDoseReport {
  baselineDoseUg: number;
  adjustedDoseUg: number;
  preventedUg: number;
  whoRatio: number;
  safeWindow: string;
  sensitivityLabel: string;
}

export function computeBioDose(
  city: CityAQI,
  profile: HouseholdProfile,
  pm25ReductionPct: number
): BioDoseReport {
  // Standard adult resting inhalation ~15 m³/day; sensitivity weights for vulnerable groups
  let multiplier = 1.0;
  if (profile.members.includes('Kids')) multiplier += 0.25;
  if (profile.members.includes('Elderly')) multiplier += 0.2;
  if (profile.members.includes('Asthma / Sensitive')) multiplier += 0.4;

  const commuteFactor =
    profile.commute === 'Two-Wheeler' || profile.commute === 'Walk / Cycle'
      ? 1.25
      : profile.commute === 'Car'
        ? 1.05
        : 0.9;

  // Indoor attenuation factor (HEPA cuts indoor exposure significantly)
  const indoorFactor = profile.indoor.includes('HEPA Purifier') ? 0.52 : 0.78;

  const effectiveFactor = multiplier * commuteFactor * indoorFactor;
  const baselineDoseUg = Math.round(city.pm25 * 1.6 * effectiveFactor);
  const adjustedDoseUg = Math.round(
    baselineDoseUg * (1 - Math.min(75, pm25ReductionPct) / 100)
  );
  const preventedUg = Math.max(0, baselineDoseUg - adjustedDoseUg);
  const whoRatio = +(adjustedDoseUg / 24).toFixed(1);

  const safeWindow =
    city.aqi > 300
      ? 'Indoors Only (HEPA On)'
      : city.aqi > 200
        ? '1:30 PM – 3:45 PM'
        : city.aqi > 100
          ? '12:30 PM – 4:30 PM'
          : '6:30 AM – 6:30 PM';

  const sensitivityLabel =
    multiplier >= 1.4
      ? 'High-Sensitivity Household'
      : multiplier > 1.0
        ? 'Protected Family Profile'
        : 'Standard Adult Profile';

  return {
    baselineDoseUg,
    adjustedDoseUg,
    preventedUg,
    whoRatio,
    safeWindow,
    sensitivityLabel,
  };
}

export function getAqiMeta(aqi: number): { color: string; label: string } {
  if (aqi <= 50) return { color: '#34C759', label: 'Good' };
  if (aqi <= 100) return { color: '#9FD356', label: 'Satisfactory' };
  if (aqi <= 200) return { color: '#FFCC00', label: 'Moderate' };
  if (aqi <= 300) return { color: '#FF9500', label: 'Poor' };
  if (aqi <= 400) return { color: '#FF3B30', label: 'Very Poor' };
  return { color: '#AF52DE', label: 'Severe' };
}

export function buildCustomCity(name: string): CityAQI {
  const seed = name
    .trim()
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const aqi = 95 + (seed % 260);
  const meta = getAqiMeta(aqi);
  return {
    name: name.trim(),
    lat: 20.5937 + ((seed % 14) - 7),
    lon: 78.9629 + ((seed % 12) - 6),
    aqi,
    pm25: Math.round(aqi * 0.56),
    pm10: Math.round(aqi * 0.91),
    no2: 28 + (seed % 45),
    o3: 30 + (seed % 25),
    condition: meta.label,
    smogNote:
      aqi > 200
        ? 'High winter particulate load; prioritize indoor filtration and N95 masks outdoors.'
        : 'Moderate urban air; time outdoor activity for midday dispersion.',
  };
}

export function decodeWeatherCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Mostly Cloudy';
  if (code === 45 || code === 48) return 'Haze / Fog';
  if (code >= 51 && code <= 67) return 'Light Rain';
  if (code >= 71 && code <= 77) return 'Snow / Sleet';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Partly Cloudy';
}

export async function fetchCityWeather(
  lat: number,
  lon: number
): Promise<WeatherForecast> {
  const localHour = new Date().getHours();
  const fallbackIsDay = localHour >= 6 && localHour < 18;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&hourly=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2`
    );
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();

    const cur = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    const currentTimeStr = String(cur?.time ?? '').slice(0, 13);
    const startIdx = Math.max(
      0,
      (hourly?.time as string[] | undefined)?.findIndex((t) =>
        t.startsWith(currentTimeStr)
      ) ?? 0
    );

    const points: HourlyPoint[] = [];
    for (let i = startIdx; i < Math.min(startIdx + 7, hourly?.time?.length ?? 0); i++) {
      const iso: string = hourly.time[i];
      const hr = Number(iso.slice(11, 13));
      const label =
        i === startIdx
          ? 'Now'
          : hr === 0
            ? '12 AM'
            : hr < 12
              ? `${hr} AM`
              : hr === 12
                ? '12 PM'
                : `${hr - 12} PM`;

      points.push({
        time: label,
        temp: Math.round(hourly.temperature_2m[i]),
        isDay: hourly.is_day[i] === 1,
        code: hourly.weather_code[i] ?? 2,
      });
    }

    const code = cur?.weather_code ?? 2;
    return {
      temp: Math.round(cur?.temperature_2m ?? 26),
      high: Math.round(daily?.temperature_2m_max?.[0] ?? 31),
      low: Math.round(daily?.temperature_2m_min?.[0] ?? 21),
      condition: decodeWeatherCode(code),
      isDay: cur?.is_day === 1,
      code,
      hourly: points,
    };
  } catch {
    return {
      temp: 26,
      high: 31,
      low: 21,
      condition: 'Mostly Cloudy',
      isDay: fallbackIsDay,
      code: 3,
      hourly: Array.from({ length: 7 }, (_, i) => {
        const hr = (localHour + i) % 24;
        return {
          time: i === 0 ? 'Now' : `${hr % 12 || 12} ${hr < 12 ? 'AM' : 'PM'}`,
          temp: 26 - Math.floor(i / 2),
          isDay: hr >= 6 && hr < 18,
          code: 3,
        };
      }),
    };
  }
}

export async function fetchCityAQI(query: string): Promise<CityAQI> {
  const trimmed = query.trim();
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        trimmed
      )}&count=1&language=en&format=json`
    );
    if (!geoRes.ok) throw new Error('Geocoding failed');
    const geoData = await geoRes.json();
    const place = geoData?.results?.[0];
    if (!place) throw new Error('Location not found');

    const { latitude, longitude, name, country } = place;
    const aqRes = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone`
    );
    if (!aqRes.ok) throw new Error('Air quality fetch failed');
    const aqData = await aqRes.json();
    const cur = aqData?.current;
    const aqi = Math.round(cur?.us_aqi ?? 110);
    const meta = getAqiMeta(aqi);

    return {
      name: country ? `${name}, ${country}` : name,
      lat: latitude,
      lon: longitude,
      aqi,
      pm25: Math.round(cur?.pm2_5 ?? aqi * 0.5),
      pm10: Math.round(cur?.pm10 ?? aqi * 0.85),
      no2: Math.round(cur?.nitrogen_dioxide ?? 25),
      o3: Math.round(cur?.ozone ?? 35),
      condition: meta.label,
      smogNote:
        aqi > 200
          ? 'Live reading shows elevated particulate load; prioritize indoor filtration and N95 masks outdoors.'
          : aqi > 100
            ? 'Live moderate air quality; time outdoor activity for midday dispersion.'
            : 'Live reading shows clean air; ideal window for cross-ventilation.',
    };
  } catch {
    return buildCustomCity(trimmed);
  }
}

function buildFallbackGuidance(
  city: CityAQI,
  profile: HouseholdProfile
): GuidancePlan {
  const highRisk =
    profile.members.includes('Kids') ||
    profile.members.includes('Elderly') ||
    profile.members.includes('Asthma / Sensitive');
  const hasPurifier = profile.indoor.includes('HEPA Purifier');
  const isSevere = city.aqi > 200;

  return {
    source: 'hrl-engine',
    summary: isSevere
      ? `${city.name} is at AQI ${city.aqi} (${city.condition}). ${
          highRisk
            ? 'With sensitive household members, keep exertion indoors and seal morning drafts.'
            : 'Shift outdoor routines to midday and cut indoor combustion sources.'
        }`
      : `${city.name} is at AQI ${city.aqi} (${city.condition}). Good window for normal routines with smart ventilation timing.`,
    routine: [
      {
        time: 'Morning (6:30 – 10:00 AM)',
        action: isSevere
          ? 'Keep windows sealed; do 15-min indoor mobility instead of outdoor walks.'
          : 'Light outdoor walk; avoid busy arterial roads.',
        why: 'Cold morning air traps vehicle & biomass PM2.5 near breathing height.',
      },
      {
        time: 'Midday (1:00 – 4:00 PM)',
        action: `Open cross-ventilation for 20 mins. ${
          profile.commute === 'Car'
            ? 'Consider Metro or carpooling for afternoon errands.'
            : 'Best window for essential outdoor errands.'
        }`,
        why: 'Solar heating lifts the inversion layer, dropping outdoor PM2.5 by up to 35%.',
      },
      {
        time: 'Evening (6:00 – 10:00 PM)',
        action: hasPurifier
          ? 'Run HEPA purifier on Medium/Auto in bedrooms 1 hr before sleep.'
          : 'Wet-mop floors and run kitchen exhaust while cooking.',
        why: 'Evening traffic + cooling air spikes PM2.5; clean bedroom air aids overnight recovery.',
      },
    ],
    indoorHacks: [
      'Wet-mop hard floors instead of dry sweeping to avoid resuspending settled PM10 dust.',
      'Place damp microfiber cloths or door-draft stoppers under main entry doors during peak smog.',
      'Use kitchen exhaust + lid-on cooking to cut indoor NO₂ and ultrafine aerosol spikes by >50%.',
      highRisk
        ? 'Keep rescue inhalers accessible and use N95/FFP2 masks for any trip >10 mins outdoors.'
        : 'Add Spider Plant or Snake Plant near living areas for modest VOC & humidity support.',
    ],
  };
}

export async function generateGuidance(
  city: CityAQI,
  profile: HouseholdProfile,
  apiKey?: string
): Promise<GuidancePlan> {
  if (!apiKey || !apiKey.trim()) {
    return buildFallbackGuidance(city, profile);
  }

  const prompt = `You are Vyoma, an Urban Air Quality Assistant.
City: ${city.name}, AQI: ${city.aqi} (${city.condition}), PM2.5: ${city.pm25} µg/m³, PM10: ${city.pm10} µg/m³.
Household: ${profile.members.join(', ') || 'General adult'}, Commute: ${profile.commute}, Indoor setup: ${profile.indoor.join(', ') || 'Standard'}.
Return ONLY valid JSON with this exact shape:
{
  "summary": "2-sentence tailored summary",
  "routine": [
    {"time": "Morning (6:30 - 10:00 AM)", "action": "...", "why": "..."},
    {"time": "Midday (1:00 - 4:00 PM)", "action": "...", "why": "..."},
    {"time": "Evening (6:00 - 10:00 PM)", "action": "...", "why": "..."}
  ],
  "indoorHacks": ["hack 1", "hack 2", "hack 3", "hack 4"]
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey.trim()
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini API ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty Gemini response');
    const parsed = JSON.parse(text);
    return {
      source: 'gemini',
      summary: parsed.summary,
      routine: parsed.routine,
      indoorHacks: parsed.indoorHacks,
    };
  } catch {
    return buildFallbackGuidance(city, profile);
  }
}
