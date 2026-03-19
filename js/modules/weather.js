/* ══════════════════════════════════════════
   MODULE: Weather — Open-Meteo API (free, no key)
   Adjusts hydration goal based on temperature
   ══════════════════════════════════════════ */

const Weather = (() => {
  let _cache = null;
  let _cacheTime = 0;
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /* ── Get user's coords via Geolocation API ── */
  const getCoords = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err),
      { timeout: 8000, maximumAge: 600_000 }
    );
  });

  /* ── Fetch current weather from Open-Meteo ── */
  const fetch = async () => {
    if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;
    try {
      const { lat, lon } = await getCoords();
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&temperature_unit=celsius&timezone=auto`;
      const res  = await window.fetch(url);
      const data = await res.json();
      const cur  = data.current;
      _cache = {
        temp:     cur.temperature_2m,
        feelsLike: cur.apparent_temperature,
        humidity: cur.relative_humidity_2m,
        code:     cur.weather_code,
        lat, lon,
      };
      _cacheTime = Date.now();
      return _cache;
    } catch (e) {
      console.warn('[Weather] fetch failed:', e.message);
      return null;
    }
  };

  /* ── Hydration adjustment based on temperature ── */
  const getAdvice = (weather) => {
    if (!weather) return null;
    const t = weather.temp;
    const h = weather.humidity;

    // WMO weather condition codes
    const isRaining = weather.code >= 51 && weather.code <= 82;
    const isSnow    = weather.code >= 71 && weather.code <= 77;

    let extraMl   = 0;
    let emoji     = '🌡️';
    let level     = 'normal';
    let headline  = '';
    let detail    = '';

    if (t >= 38) {
      extraMl = 1000; level = 'extreme'; emoji = '🔥';
      headline = 'Extreme heat alert!';
      detail   = `${t}°C outside — drink an extra litre today.`;
    } else if (t >= 32) {
      extraMl = 600; level = 'hot'; emoji = '☀️';
      headline = 'It\'s very hot out';
      detail   = `${t}°C — add 600ml to your goal today.`;
    } else if (t >= 26) {
      extraMl = 300; level = 'warm'; emoji = '🌤️';
      headline = 'Warm day';
      detail   = `${t}°C — a little extra water helps.`;
    } else if (t <= 0) {
      extraMl = 0; level = 'cold'; emoji = '❄️';
      headline = 'Freezing outside';
      detail   = `${t}°C — indoor heating is drying. Stay hydrated.`;
    } else if (t <= 10) {
      extraMl = 0; level = 'cool'; emoji = '🌨️';
      headline = 'Cool weather';
      detail   = `${t}°C — cold air is drier. Keep sipping.`;
    } else {
      emoji = '🌤️'; level = 'normal';
      headline = 'Good conditions';
      detail   = `${t}°C — standard hydration goal applies.`;
    }

    if (h < 30 && level === 'normal') {
      emoji = '🏜️'; headline = 'Very dry air';
      detail = `${h}% humidity — dry air increases water loss.`;
      extraMl = 200;
    }

    return { temp: t, feelsLike: weather.feelsLike, humidity: h, extraMl, emoji, level, headline, detail };
  };

  const getIcon = (code) => {
    if (code === 0)               return '☀️';
    if (code <= 3)                return '⛅';
    if (code <= 48)               return '🌫️';
    if (code <= 67)               return '🌧️';
    if (code <= 77)               return '❄️';
    if (code <= 82)               return '🌦️';
    if (code <= 99)               return '⛈️';
    return '🌡️';
  };

  return { fetch, getAdvice, getIcon };
})();
