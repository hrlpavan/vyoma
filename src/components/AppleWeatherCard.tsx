import { Cloud, CloudRain, CloudSun, Moon, Sun, Navigation } from 'lucide-react';
import type { WeatherForecast } from '../data/airQuality';

interface AppleWeatherCardProps {
  cityName: string;
  weather: WeatherForecast | null;
}

const STARS = [
  { top: '12%', left: '8%', size: 2, opacity: 0.7 },
  { top: '22%', left: '19%', size: 1.5, opacity: 0.5 },
  { top: '9%', left: '34%', size: 2, opacity: 0.8 },
  { top: '18%', left: '48%', size: 1.5, opacity: 0.45 },
  { top: '14%', left: '62%', size: 2.5, opacity: 0.75 },
  { top: '28%', left: '88%', size: 2, opacity: 0.65 },
  { top: '38%', left: '12%', size: 1.5, opacity: 0.5 },
  { top: '42%', left: '78%', size: 2, opacity: 0.6 },
  { top: '8%', left: '92%', size: 1.5, opacity: 0.7 },
  { top: '33%', left: '29%', size: 1.5, opacity: 0.4 },
];

function HourlyIcon({ code, isDay }: { code: number; isDay: boolean }) {
  if (code >= 51 && code <= 82) {
    return <CloudRain size={16} color="#93c5fd" />;
  }
  if (code === 0 || code === 1) {
    return isDay ? (
      <Sun size={16} color="#fde047" />
    ) : (
      <Moon size={15} color="#e2e8f0" />
    );
  }
  if (code === 2 && isDay) {
    return <CloudSun size={16} color="#fde047" />;
  }
  return <Cloud size={16} color="rgba(255,255,255,0.9)" />;
}

function getMoonPhase(date: Date): number {
  // Synodic month from known New Moon (2000-01-06T18:14:00Z)
  const synodicMs = 29.53058867 * 86400000;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const diff = (date.getTime() - knownNewMoon) % synodicMs;
  return (diff < 0 ? diff + synodicMs : diff) / synodicMs; // 0 = New, 0.5 = Full
}

function RealMoon({ size = 64 }: { size?: number }) {
  const phase = getMoonPhase(new Date());
  // Illumination: 0 at New Moon (0/1), 1 at Full Moon (0.5)
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * phase));
  const waxing = phase <= 0.5;
  // Soft terminator gradient across the lunar disc
  const litPct = Math.round(illumination * 100);
  const maskGradient = waxing
    ? `linear-gradient(90deg, rgba(0,0,0,0.08) ${Math.max(
        0,
        100 - litPct - 18
      )}%, #000000 ${Math.min(100, 100 - litPct + 10)}%)`
    : `linear-gradient(270deg, rgba(0,0,0,0.08) ${Math.max(
        0,
        100 - litPct - 18
      )}%, #000000 ${Math.min(100, 100 - litPct + 10)}%)`;

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 24,
        width: size,
        height: size,
        borderRadius: '50%',
        mixBlendMode: 'screen',
        filter: 'drop-shadow(0 0 18px rgba(226, 232, 240, 0.35))',
        pointerEvents: 'none',
      }}
    >
      <img
        src="/moon.jpg"
        alt="Live Lunar Phase"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '50%',
          display: 'block',
          WebkitMaskImage: maskGradient,
          maskImage: maskGradient,
        }}
      />
    </div>
  );
}

export function AppleWeatherCard({ cityName, weather }: AppleWeatherCardProps) {
  const isDay = weather?.isDay ?? true;

  const skyBackground = isDay
    ? 'linear-gradient(160deg, #1b6de5 0%, #3b93f3 52%, #6ec0ff 100%)'
    : 'linear-gradient(165deg, #0b1224 0%, #172038 55%, #27324e 100%)';

  return (
    <section
      style={{
        position: 'relative',
        borderRadius: 22,
        overflow: 'hidden',
        background: skyBackground,
        color: '#ffffff',
        padding: '22px 20px 16px',
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.14)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        marginBottom: 20,
      }}
    >
      {/* Night Stars */}
      {!isDay &&
        STARS.map((s, idx) => (
          <span
            key={idx}
            style={{
              position: 'absolute',
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              background: '#ffffff',
              opacity: s.opacity,
              pointerEvents: 'none',
            }}
          />
        ))}

      {/* Atmospheric Cloud Wisps */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          left: -40,
          width: 240,
          height: 110,
          borderRadius: '50%',
          background: isDay
            ? 'radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 70%)'
            : 'radial-gradient(circle, rgba(148,163,184,0.16) 0%, rgba(148,163,184,0) 70%)',
          filter: 'blur(12px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: '18%',
          width: 260,
          height: 90,
          borderRadius: '50%',
          background: isDay
            ? 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)'
            : 'radial-gradient(circle, rgba(148,163,184,0.14) 0%, rgba(148,163,184,0) 70%)',
          filter: 'blur(14px)',
          pointerEvents: 'none',
        }}
      />

      {/* Sun or Real Moon */}
      {isDay ? (
        <div
          style={{
            position: 'absolute',
            top: 22,
            right: 28,
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fff7ae 0%, #ffd43b 65%, #f59f00 100%)',
            boxShadow: '0 0 36px rgba(255, 224, 102, 0.75)',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <RealMoon size={64} />
      )}

      {/* Centered Apple Weather Header */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          paddingBottom: 16,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            opacity: 0.85,
            marginBottom: 2,
          }}
        >
          <Navigation size={10} fill="currentColor" />
          <span>{isDay ? 'Daylight Forecast' : 'Night Forecast'}</span>
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          {cityName}
        </h2>

        <div
          className="tabular-nums"
          style={{
            fontSize: 64,
            fontWeight: 200,
            letterSpacing: '-0.04em',
            lineHeight: 1.02,
            margin: '4px 0',
          }}
        >
          {weather ? `${weather.temp}°` : '--°'}
        </div>

        <div style={{ fontSize: 15, fontWeight: 500, opacity: 0.94 }}>
          {weather?.condition ?? 'Loading forecast...'}
        </div>

        {weather && (
          <div
            className="tabular-nums"
            style={{ fontSize: 14, fontWeight: 500, opacity: 0.9, marginTop: 2 }}
          >
            H:{weather.high}° &nbsp; L:{weather.low}°
          </div>
        )}
      </div>

      {/* Frosted Hourly Forecast Strip */}
      {weather && weather.hourly.length > 0 && (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(${weather.hourly.length}, minmax(0, 1fr))`,
            gap: 6,
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.18)',
          }}
        >
          {weather.hourly.map((pt) => (
            <div
              key={pt.time}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>
                {pt.time}
              </span>
              <HourlyIcon code={pt.code} isDay={pt.isDay} />
              <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 600 }}>
                {pt.temp}°
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
