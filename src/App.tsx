import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Leaf,
  KeyRound,
  Search,
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  Activity,
  Share2,
  Check,
} from 'lucide-react';
import {
  CITIES,
  SUSTAINABLE_SWAPS,
  computeBioDose,
  fetchCityAQI,
  fetchCityWeather,
  generateGuidance,
  getAqiMeta,
  type CityAQI,
  type GuidancePlan,
  type HouseholdProfile,
  type WeatherForecast,
} from './data/airQuality';
import { AqiMap } from './components/AqiMap';
import { AppleWeatherCard } from './components/AppleWeatherCard';

const MEMBER_OPTIONS = ['Kids', 'Elderly', 'Asthma / Sensitive', 'Pets'];
const COMMUTE_OPTIONS = ['Metro / Public', 'Car', 'Two-Wheeler', 'Walk / Cycle'];
const INDOOR_OPTIONS = ['HEPA Purifier', 'AC', 'Natural Ventilation'];

export function App() {
  const [cities, setCities] = useState<CityAQI[]>(CITIES);
  const [selectedCity, setSelectedCity] = useState<CityAQI>(CITIES[0]);
  const [customCityInput, setCustomCityInput] = useState('');
  const [searchingCity, setSearchingCity] = useState(false);
  const [profile, setProfile] = useState<HouseholdProfile>({
    members: ['Kids'],
    commute: 'Metro / Public',
    indoor: ['HEPA Purifier'],
  });
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [plan, setPlan] = useState<GuidancePlan | null>(null);
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [activeSwaps, setActiveSwaps] = useState<string[]>([
    'commute-metro',
    'smart-vent',
  ]);

  const aqiMeta = useMemo(
    () => getAqiMeta(selectedCity.aqi),
    [selectedCity.aqi]
  );

  const thumbPercent = Math.min(100, Math.max(2, (selectedCity.aqi / 500) * 100));

  const impactTotals = useMemo(() => {
    return SUSTAINABLE_SWAPS.filter((s) => activeSwaps.includes(s.id)).reduce(
      (acc, s) => ({
        pm25: Math.min(75, acc.pm25 + s.pm25ReductionPct),
        co2: +(acc.co2 + s.co2SavedKgPerWeek).toFixed(1),
      }),
      { pm25: 0, co2: 0 }
    );
  }, [activeSwaps]);

  const bioDose = useMemo(
    () => computeBioDose(selectedCity, profile, impactTotals.pm25),
    [selectedCity, profile, impactTotals.pm25]
  );

  const handleCopyBrief = async () => {
    const topHack =
      plan?.indoorHacks?.[0] ??
      'Run HEPA purifier and wet-mop floors instead of dry sweeping.';
    const brief = [
      `Vyoma™ Family Air Brief — ${selectedCity.name}`,
      `AQI: ${selectedCity.aqi} (${selectedCity.condition}) | PM2.5: ${selectedCity.pm25} µg/m³`,
      `Lung-Safe Outdoor Window: ${bioDose.safeWindow}`,
      `Projected Daily Bio-Dose: ${bioDose.adjustedDoseUg} µg/day (${bioDose.preventedUg} µg/day prevented via active swaps)`,
      `Top Indoor Action: ${topHack}`,
      `— Powered by HRL Bio-Dose Engine™ (Proprietary • HRL International Pvt. Ltd.)`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(brief);
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2200);
    } catch {
      setCopiedBrief(false);
    }
  };

  const runPlanner = async (city = selectedCity, prof = profile) => {
    setLoading(true);
    const result = await generateGuidance(city, prof, apiKey);
    setPlan(result);
    setLoading(false);
  };

  useEffect(() => {
    runPlanner(selectedCity, profile);
    fetchCityWeather(selectedCity.lat, selectedCity.lon).then(setWeather);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

  const toggleArrayItem = (
    key: 'members' | 'indoor',
    value: string
  ) => {
    setProfile((prev) => {
      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((item) => item !== value)
          : [...prev[key], value],
      };
    });
  };

  const toggleSwap = (id: string) => {
    setActiveSwaps((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCustomCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCityInput.trim() || searchingCity) return;
    setSearchingCity(true);
    const nextCity = await fetchCityAQI(customCityInput);
    setCities((prev) =>
      prev.some((c) => c.name.toLowerCase() === nextCity.name.toLowerCase())
        ? prev
        : [nextCity, ...prev]
    );
    setSelectedCity(nextCity);
    setCustomCityInput('');
    setSearchingCity(false);
  };

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 20px 56px' }}>
      {/* Floating Liquid Glass Header */}
      <header
        className="glass-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '12px 18px',
          marginBottom: 22,
          borderRadius: 20,
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.42))',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.7)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background:
                'linear-gradient(145deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.32))',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow:
                'inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(0, 0, 0, 0.04)',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src="./hrl-logo.png"
              alt="HRL Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: 'scale(1.45)',
                mixBlendMode: 'multiply',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  lineHeight: 1,
                }}
              >
                Vyoma
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  lineHeight: 1,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: 'rgba(52, 199, 89, 0.14)',
                  color: '#1b8a36',
                  transform: 'translateY(0.5px)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#34c759',
                  }}
                />
                LIVE
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1.25,
                letterSpacing: '-0.005em',
                color: 'var(--text-secondary)',
              }}
            >
              Urban Air Quality Intelligence • HRL International
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <form
            onSubmit={handleCustomCity}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(118, 118, 128, 0.09)',
              border: '1px solid rgba(0, 0, 0, 0.04)',
              borderRadius: 999,
              padding: '7px 14px',
              gap: 7,
            }}
          >
            <Search size={14} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder={searchingCity ? 'Locating...' : 'Add location...'}
              value={customCityInput}
              onChange={(e) => setCustomCityInput(e.target.value)}
              disabled={searchingCity}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: 13,
                width: 145,
                background: 'transparent',
                color: 'var(--text-primary)',
              }}
            />
          </form>

          <button
            type="button"
            className={`pill-btn ${showKeyInput ? 'active' : ''}`}
            onClick={() => setShowKeyInput((s) => !s)}
            style={{ padding: '8px 14px' }}
          >
            <KeyRound size={14} />
            {apiKey ? 'Gemini Connected' : 'Gemini API Key'}
          </button>
        </div>
      </header>

      {showKeyInput && (
        <div
          className="glass-card"
          style={{
            padding: 16,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <input
            type="password"
            placeholder="Paste Gemini API key (optional — works offline too)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{
              flex: 1,
              minWidth: 240,
              padding: '9px 14px',
              borderRadius: 12,
              border: '1px solid var(--border-hairline)',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setShowKeyInput(false);
              runPlanner();
            }}
          >
            Save & Refresh Plan
          </button>
        </div>
      )}

      {/* City Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        {cities.map((city) => (
          <button
            key={city.name}
            type="button"
            className={`pill-btn ${selectedCity.name === city.name ? 'active' : ''}`}
            onClick={() => setSelectedCity(city)}
          >
            {city.name}
            <span className="tabular-nums" style={{ opacity: 0.78 }}>
              {city.aqi}
            </span>
          </button>
        ))}
      </div>

      {/* Live Day/Night Apple Weather Card */}
      <AppleWeatherCard cityName={selectedCity.name} weather={weather} />

      {/* Main Bento Grid */}
      <div
        className="bento-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.25fr',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
          {/* AQI Card */}
          <section className="glass-card" style={{ padding: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  AIR QUALITY • {selectedCity.name.toUpperCase()}
                </div>
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: 56,
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05,
                    marginTop: 4,
                  }}
                >
                  {selectedCity.aqi}
                </div>
              </div>
              <span
                style={{
                  background: aqiMeta.color,
                  color: selectedCity.aqi <= 200 && selectedCity.aqi > 50 ? '#1d1d1f' : '#fff',
                  padding: '5px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {selectedCity.condition}
              </span>
            </div>

            <div className="aqi-bar-track" style={{ margin: '14px 0 12px' }}>
              <div className="aqi-bar-thumb" style={{ left: `${thumbPercent}%` }} />
            </div>

            <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
              {selectedCity.smogNote}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
                paddingTop: 14,
                borderTop: '1px solid var(--border-hairline)',
              }}
            >
              {[
                { label: 'PM2.5', val: `${selectedCity.pm25}` },
                { label: 'PM10', val: `${selectedCity.pm10}` },
                { label: 'NO₂', val: `${selectedCity.no2}` },
                { label: 'O₃', val: `${selectedCity.o3}` },
              ].map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    {m.label}
                  </div>
                  <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 600 }}>
                    {m.val}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Interactive Location & AQI Map Card */}
          <section
            className="glass-card"
            style={{ padding: 0, overflow: 'hidden' }}
          >
            {/* Docked Map Console Bar (keeps map tiles 100% uncluttered) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-hairline)',
                background: 'var(--bg-surface)',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  minWidth: 0,
                }}
              >
                <MapPin size={14} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selectedCity.name}
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {selectedCity.lat.toFixed(2)}°, {selectedCity.lon.toFixed(2)}°
                </span>
              </div>
              <div
                className="tabular-nums"
                style={{
                  background: aqiMeta.color,
                  color:
                    selectedCity.aqi <= 200 && selectedCity.aqi > 50
                      ? '#1d1d1f'
                      : '#fff',
                  borderRadius: 999,
                  padding: '4px 11px',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                AQI {selectedCity.aqi} • {selectedCity.condition}
              </div>
            </div>

            <AqiMap
              lat={selectedCity.lat}
              lon={selectedCity.lon}
              cityName={selectedCity.name}
              aqi={selectedCity.aqi}
              color={aqiMeta.color}
            />
          </section>

          {/* Household Profile Card */}
          <section
            className="glass-card"
            style={{
              padding: 24,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              <ShieldCheck size={18} color="var(--accent-blue)" />
              Household & Lifestyle
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Household Members
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                {MEMBER_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`pill-btn ${profile.members.includes(m) ? 'active' : ''}`}
                    onClick={() => toggleArrayItem('members', m)}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      borderRadius: 12,
                      padding: '9px 12px',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Primary Commute
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                {COMMUTE_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`pill-btn ${profile.commute === c ? 'active' : ''}`}
                    onClick={() => setProfile((p) => ({ ...p, commute: c }))}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      borderRadius: 12,
                      padding: '9px 12px',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Indoor Setup
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                {INDOOR_OPTIONS.map((i, idx) => (
                  <button
                    key={i}
                    type="button"
                    className={`pill-btn ${profile.indoor.includes(i) ? 'active' : ''}`}
                    onClick={() => toggleArrayItem('indoor', i)}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      borderRadius: 12,
                      padding: '9px 12px',
                      gridColumn: idx === 2 ? 'span 2' : undefined,
                    }}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            </div>

            <button
              type="button"
              className="primary-btn"
              style={{ width: '100%' }}
              disabled={loading}
              onClick={() => runPlanner()}
            >
              <Sparkles size={16} />
              {loading ? 'Updating Routine...' : 'Update Personalized Plan'}
            </button>
          </section>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
          {/* GenAI Routine & Indoor Hacks */}
          <section className="glass-card" style={{ padding: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 16 }}>
                <Clock size={18} color="var(--accent-blue)" />
                Low-Emission Daily Routine
              </div>
              {plan && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(0, 122, 255, 0.1)',
                    color: 'var(--accent-blue)',
                  }}
                >
                  {plan.source === 'gemini' ? 'Gemini 2.5 Flash' : 'HRL Smart Engine'}
                </span>
              )}
            </div>

            {plan && (
              <>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-secondary)' }}>
                  {plan.summary}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {plan.routine.map((slot) => (
                    <div
                      key={slot.time}
                      style={{
                        background: 'var(--bg-surface-solid)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 14,
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 3 }}>
                        {slot.time}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                        {slot.action}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Why: {slot.why}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15, marginBottom: 10 }}>
                  <Home size={16} color="var(--accent-green)" />
                  Indoor Air Quality Hacks
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {plan.indoorHacks.map((hack) => (
                    <li key={hack} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {hack}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Sustainable Alternatives & Impact Explainer */}
          <section
            className="glass-card"
            style={{
              padding: 24,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 16 }}>
                <Leaf size={18} color="var(--accent-green)" />
                Sustainable Alternatives & Impact
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-green)' }}>
                  -{impactTotals.pm25}% PM2.5 Dose
                </span>
                <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-blue)' }}>
                  -{impactTotals.co2} kg CO₂/wk
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SUSTAINABLE_SWAPS.map((swap) => {
                const active = activeSwaps.includes(swap.id);
                return (
                  <button
                    key={swap.id}
                    type="button"
                    onClick={() => toggleSwap(swap.id)}
                    style={{
                      textAlign: 'left',
                      background: active ? 'rgba(52, 199, 89, 0.08)' : 'var(--bg-surface-solid)',
                      border: active
                        ? '1px solid rgba(52, 199, 89, 0.45)'
                        : '1px solid var(--border-hairline)',
                      borderRadius: 14,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        <CheckCircle2
                          size={16}
                          color={active ? 'var(--accent-green)' : 'var(--text-tertiary)'}
                        />
                        {swap.title}
                      </div>
                      <span className="tabular-nums" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-green)' }}>
                        -{swap.pm25ReductionPct}% PM2.5
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, paddingLeft: 24 }}>
                      {swap.impactExplanation}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Proprietary HRL Bio-Dose & Lung-Safe Window Engine™ */}
      <section
        className="glass-card"
        style={{
          marginTop: 20,
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Activity size={18} color="var(--accent-blue)" />
            <span style={{ fontWeight: 600, fontSize: 16 }}>
              HRL Bio-Dose &amp; Lung-Safe Window Engine™
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.05em',
                padding: '3px 9px',
                borderRadius: 999,
                background: 'rgba(0, 122, 255, 0.1)',
                color: 'var(--accent-blue)',
              }}
            >
              PATENT PENDING • EXCLUSIVE
            </span>
          </div>

          <button
            type="button"
            className="pill-btn"
            onClick={handleCopyBrief}
            style={{
              background: copiedBrief ? 'rgba(52, 199, 89, 0.14)' : 'var(--bg-pill)',
              color: copiedBrief ? '#1b8a36' : 'var(--text-primary)',
              fontWeight: 600,
            }}
          >
            {copiedBrief ? <Check size={14} /> : <Share2 size={14} />}
            {copiedBrief ? 'Family Brief Copied' : 'Copy Family Air Brief'}
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 12,
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface-solid)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 14,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>
              INHALED PM2.5 BIO-DOSE
            </div>
            <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
              {bioDose.adjustedDoseUg}{' '}
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                µg/day
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {bioDose.whoRatio}× WHO 24h safe baseline
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface-solid)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 14,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>
              LUNG-SAFE OUTDOOR WINDOW
            </div>
            <div className="tabular-nums" style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>
              {bioDose.safeWindow}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              {bioDose.sensitivityLabel}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface-solid)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 14,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>
              EXPOSURE PREVENTED
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginTop: 4,
                color: 'var(--accent-green)',
              }}
            >
              -{bioDose.preventedUg}{' '}
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                µg/day
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Down from {bioDose.baselineDoseUg} µg/day unmitigated
            </div>
          </div>
        </div>
      </section>

      {/* HRL Proprietary & Patent Footer */}
      <footer
        style={{
          marginTop: 40,
          paddingTop: 22,
          borderTop: '1px solid var(--border-hairline)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontSize: 12,
          color: 'var(--text-tertiary)',
          lineHeight: 1.55,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src="./hrl-logo.png"
              alt="HRL International"
              style={{
                width: 22,
                height: 22,
                objectFit: 'contain',
                borderRadius: 6,
                background: '#ffffff',
                border: '1px solid var(--border-hairline)',
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              Vyoma™ — HRL International Private Limited
            </span>
          </div>
          <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
            Built for PromptWars Virtual • Challenge 06
          </span>
        </div>

        <div>
          <strong>Proprietary Software &amp; Patent Notice:</strong> This software,
          including the <strong>HRL Bio-Dose &amp; Lung-Safe Window Engine™</strong>,{' '}
          <strong>HRL Clean-Air Family Brief™</strong>, HRL Design Language
          interface, inference routines, and brand assets, is proprietary
          intellectual property (Patent Pending) of{' '}
          <strong>HRL International Private Limited</strong> (Mangaluru,
          Karnataka, India). <strong>Not Open Source.</strong> Unauthorized
          copying, redistribution, reverse engineering, or commercial
          exploitation is strictly prohibited under applicable patent,
          copyright, and DMCA laws.
        </div>

        <div style={{ fontSize: 11, opacity: 0.85 }}>
          © 2026 HRL International Private Limited. All Rights Reserved. •
          Zero-telemetry local-first processing.
        </div>
      </footer>
    </div>
  );
}

export default App;
