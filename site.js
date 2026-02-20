// ============================================================
// BOARDSHORT PHOTOGRAPHY — site.js
// ============================================================
//
// QUICK REFERENCE — things you'll want to tune:
//
//   TOTAL_SLOTS   → number of grid slots per row (default 40)
//   THUMB_H       → thumbnail row height on desktop in px
//   THUMB_H_SM    → thumbnail row height on mobile in px
//   DEFAULT_LAT/LNG → your home shooting location
//   WEATHER_API_KEY → set in Netlify environment variables
//
// ============================================================


// ── GRID CONFIG ─────────────────────────────────────────────
// Change these three numbers to tune the entire grid.
// TOTAL_SLOTS: how many equal slots each row is divided into.
//   - 40 slots = each slot is 2.5% of the row width
//   - 50 slots = each slot is 2.0% of the row width
// THUMB_H: fixed height of every thumbnail row, in pixels.

const TOTAL_SLOTS = 40;    // ← try 40 or 50
const THUMB_H     = 88;    // px — desktop row height
const THUMB_H_SM  = 52;    // px — mobile row height (< 600px)


// ── LOCATION & WEATHER CONFIG ───────────────────────────────

const DEFAULT_LAT = 32.7157;    // San Diego
const DEFAULT_LNG = -117.1611;

// OpenWeatherMap API key.
// Set WEATHER_API_KEY as an environment variable in Netlify.
// Never paste your key directly into this file if it's public.
const WEATHER_API_KEY = window.__WEATHER_KEY__ || '';


// ── GRID INIT ───────────────────────────────────────────────
// Calculates --slot-w and --thumb-h from the actual rendered
// width of the timeline container and sets them as CSS variables.
// Runs on load and on window resize.

function initGrid() {
  const timeline = document.getElementById('timeline');
  const rowWidth  = timeline.clientWidth;
  const isMobile  = window.innerWidth < 600;
  const thumbH    = isMobile ? THUMB_H_SM : THUMB_H;
  const slotW     = rowWidth / TOTAL_SLOTS;

  document.documentElement.style.setProperty('--slot-w',  `${slotW}px`);
  document.documentElement.style.setProperty('--thumb-h', `${thumbH}px`);
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initGrid, 120);
});


// ── SOLAR NOON ──────────────────────────────────────────────
// Determines sunrise vs sunset tag automatically.
// Returns solar noon in UTC hours for a given date and location.
// Images before solar noon → sunrise (left cluster)
// Images after solar noon  → sunset  (right cluster)

function getSolarNoon(date, lat, lng) {
  const d  = new Date(date);
  const JD = Math.floor(d / 86400000) + 2440587.5;
  const n  = JD - 2451545.0;
  const L  = (280.46 + 0.9856474 * n) % 360;
  const g  = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
  const R  = 1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g);
  const eps = (23.439 - 0.0000004 * n) * Math.PI / 180;
  const RA  = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) * 12 / Math.PI;
  const eot = L / 15 - ((RA + 24) % 24);
  return 12 - lng / 15 - eot; // UTC hours
}

function getTag(timeStr) {
  // Simple rule: before noon local = sunrise, after = sunset.
  // Precise enough for artistic tagging purposes.
  const [h, m] = timeStr.split(':').map(Number);
  return (h + m / 60) < 12 ? 'sunrise' : 'sunset';
}


// ── WEATHER ─────────────────────────────────────────────────
// Fetches historical weather from OpenWeatherMap for a given
// date, time, and location. Results are cached to avoid
// redundant API calls within the same page session.

const weatherCache = {};

async function fetchWeather(date, timeStr, lat, lng) {
  if (!WEATHER_API_KEY) return null;

  const cacheKey = `${date}-${Math.round(lat * 10)}-${Math.round(lng * 10)}`;
  if (weatherCache[cacheKey]) return weatherCache[cacheKey];

  try {
    const dt  = new Date(`${date}T${timeStr}:00`);
    const unix = Math.floor(dt.getTime() / 1000);
    const url  = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lng}&dt=${unix}&appid=${WEATHER_API_KEY}&units=imperial`;

    const res  = await fetch(url);
    if (!res.ok) throw new Error('weather api error');

    const data   = await res.json();
    const w      = data.data?.[0];
    if (!w) throw new Error('no data');

    const result = formatWeather(w);
    weatherCache[cacheKey] = result;
    return result;
  } catch (e) {
    return null;
  }
}

function formatWeather(w) {
  const temp  = Math.round(w.temp);
  const desc  = w.weather?.[0]?.description || '';
  const wind  = Math.round(w.wind_speed);
  const dir   = degreesToCardinal(w.wind_deg);
  const cap   = desc.charAt(0).toUpperCase() + desc.slice(1);
  return `${temp}°F · ${cap} · Wind ${dir} ${wind}mph`;
}

function degreesToCardinal(deg) {
  if (deg === undefined) return '';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}


// ── CONTENT LOADING ─────────────────────────────────────────
// Reads from /content/index.json (generated by build.js).
// Falls back to demo data if no content file exists yet.

async function loadContent() {
  try {
    const res = await fetch('/content/index.json');
    if (!res.ok) throw new Error('no content');
    return await res.json();
  } catch (e) {
    return getDemoData();
  }
}


// ── DEMO DATA ───────────────────────────────────────────────
// Shown before you add real content via the CMS.
// Replace with your first real day entries to remove this.

function getDemoData() {
  return [
    {
      date: "2025-06-14",
      is_hero: true,
      hero_index: 2,
      location: "Torrey Pines, San Diego",
      lat: 32.9184,
      lng: -117.2536,
      images: [
        { id:"s1", src:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", type:"image", caption:"First light over the ridge",      time:"05:47", weather:"58°F · Clear · Wind SW 6mph",       tag:"sunrise" },
        { id:"s2", src:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80", type:"image", caption:"The horizon holds its breath",    time:"05:53", weather:"59°F · Clear · Wind SW 6mph",       tag:"sunrise" },
        { id:"s3", src:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=80", type:"image", caption:"Vertical light",                  time:"06:01", weather:"60°F · Clear",                      tag:"sunrise" },
        { id:"s4", src:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80", type:"image", caption:"Golden wash on the water",        time:"06:14", weather:"61°F · Clear",                      tag:"sunrise" },
        { id:"s5", src:"https://images.unsplash.com/photo-1490750967868-88df5691cc51?w=800&q=80", type:"image", caption:"The pink hour",                   time:"06:28", weather:"62°F · Partly cloudy",               tag:"sunrise" },
        { id:"u1", src:"https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80", type:"image", caption:"Last embers",                     time:"20:11", weather:"68°F · Clear · Wind NW 12mph",      tag:"sunset"  },
        { id:"u2", src:"https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800&q=80", type:"image", caption:"Afterglow lingers",               time:"20:34", weather:"65°F · Clear",                      tag:"sunset"  },
        { id:"u3", src:"https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80", type:"image", caption:"Vertical last light",             time:"20:39", weather:"64°F · Clear",                      tag:"sunset"  },
      ]
    },
    {
      date: "2025-06-13",
      is_hero: false,
      location: "La Jolla Cove, San Diego",
      lat: 32.8509,
      lng: -117.2719,
      images: [
        { id:"a1", src:"https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80", type:"image", caption:"Marine layer burns off",           time:"06:02", weather:"55°F · Fog · Wind W 8mph",          tag:"sunrise" },
        { id:"a2", src:"https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800&q=80", type:"image", caption:"Through the fog",                 time:"06:18", weather:"56°F · Fog clearing",               tag:"sunrise" },
        { id:"b1", src:"https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=800&q=80", type:"image", caption:"Dusk palette",                    time:"19:58", weather:"64°F · Clear · Wind NW 10mph",      tag:"sunset"  },
        { id:"b2", src:"https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80", type:"image", caption:"Tide retreats",                   time:"20:05", weather:"63°F · Clear",                      tag:"sunset"  },
        { id:"b3", src:"https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80", type:"image", caption:"Waterfall light",                 time:"20:39", weather:"61°F · Clear",                      tag:"sunset"  },
      ]
    },
    {
      date: "2025-06-12",
      is_hero: false,
      location: "Ocean Beach, San Diego",
      lat: 32.7484,
      lng: -117.2503,
      images: [
        { id:"c1", src:"https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=800&q=80", type:"image", caption:"Pre-dawn stillness",              time:"05:51", weather:"52°F · Clear · Wind calm",          tag:"sunrise" },
        { id:"c2", src:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80", type:"image", caption:"Forest edge",                     time:"06:08", weather:"54°F · Clear",                      tag:"sunrise" },
        { id:"d1", src:"https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&q=80", type:"image", caption:"Waves catch the last light",      time:"20:28", weather:"61°F · Breezy · Wind NW 18mph",     tag:"sunset"  },
      ]
    },
  ];
}


// ── PROCESS DAYS ────────────────────────────────────────────
// Auto-tags each image (sunrise/sunset) and fetches weather
// for any image that doesn't already have it.

async function processDays(days) {
  const processed = [];

  for (const day of days) {
    const lat    = day.lat || DEFAULT_LAT;
    const lng    = day.lng || DEFAULT_LNG;
    const label  = formatDateLabel(day.date);
    const images = [];

    for (const img of (day.images || [])) {
      const tag     = img.tag || getTag(img.time);
      let weather   = img.weather;

      if (!weather && WEATHER_API_KEY) {
        weather = await fetchWeather(day.date, img.time, lat, lng);
      }

      images.push({
        ...img,
        id: img.id || `${day.date}-${img.time}-${Math.random().toString(36).slice(2, 6)}`,
        tag,
        weather:  weather || '—',
        location: day.location || 'San Diego, CA',
      });
    }

    processed.push({ ...day, label, images });
  }

  return processed;
}

function formatDateLabel(iso) {
  const [y, m, d] = iso.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}


// ── STATE ───────────────────────────────────────────────────

let DAYS            = [];
let FLAT            = [];
let currentFlatIndex = 0;
let heroFlatIndex    = 0;


// ── RENDER HERO ─────────────────────────────────────────────

function renderHero() {
  const heroDay = DAYS.find(d => d.is_hero);
  if (!heroDay) return;

  const img = heroDay.images[heroDay.hero_index] || heroDay.images[0];
  if (!img) return;

  document.getElementById('hero-wrap').style.display = 'block';
  document.getElementById('hero-img').src             = img.src;
  document.getElementById('hero-caption').textContent = img.caption || '';
  document.getElementById('hero-tag').textContent     = img.tag.charAt(0).toUpperCase() + img.tag.slice(1);
  document.getElementById('hero-tag').style.background =
    img.tag === 'sunrise' ? 'rgba(200,131,60,0.92)' : 'rgba(180,70,40,0.92)';
  document.getElementById('hero-data').innerHTML =
    `${heroDay.label}<br>${img.time} · ${img.location}<br>${img.weather}`;

  heroFlatIndex = FLAT.findIndex(f => f.id === img.id);
}


// ── RENDER TIMELINE ─────────────────────────────────────────

function renderTimeline() {
  const container = document.getElementById('timeline');
  container.innerHTML = '';

  if (DAYS.length === 0) {
    container.innerHTML = '<div class="loading-state">No entries yet. Add your first day in the CMS.</div>';
    return;
  }

  let total = 0;

  DAYS.forEach(day => {
    const sunrise = day.images.filter(i => i.tag === 'sunrise');
    const sunset  = day.images.filter(i => i.tag === 'sunset');
    const open    = TOTAL_SLOTS - sunrise.length - sunset.length;
    total += day.images.length;

    const block = document.createElement('div');
    block.className = 'day-block';

    block.innerHTML = `
      <div class="day-header">
        <span class="day-date">${day.label}</span>
        <span class="day-count">${sunrise.length} sunrise · ${sunset.length} sunset · ${open} open</span>
      </div>
    `;

    // Contact strip — always TOTAL_SLOTS wide
    const strip = document.createElement('div');
    strip.className = 'contact-strip';

    // LEFT: sunrise fills from left edge
    const leftCluster = document.createElement('div');
    leftCluster.className = 'cluster-sunrise';
    sunrise.forEach(img => leftCluster.appendChild(makeThumb(img)));

    // MIDDLE: pure white space (flex: 1 takes all remaining width)
    const gapZone = document.createElement('div');
    gapZone.className = 'gap-zone';

    // RIGHT: sunset fills from right edge
    const rightCluster = document.createElement('div');
    rightCluster.className = 'cluster-sunset';
    sunset.forEach(img => rightCluster.appendChild(makeThumb(img)));

    strip.appendChild(leftCluster);
    strip.appendChild(gapZone);
    strip.appendChild(rightCluster);
    block.appendChild(strip);
    container.appendChild(block);
  });

  document.getElementById('footer-count').textContent = `${total} photographs archived`;
}

function makeThumb(img) {
  const flatIdx = FLAT.findIndex(f => f.id === img.id);

  const wrap = document.createElement('div');
  wrap.className = 'thumb-wrap' + (img.type === 'video' ? ' is-video' : '');

  const el = img.type === 'video'
    ? Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true })
    : Object.assign(document.createElement('img'),   { alt: img.caption || '', loading: 'lazy' });
  el.src = img.src;

  const tag = document.createElement('div');
  tag.className = `thumb-tag ${img.tag}`;
  tag.textContent = img.tag;

  wrap.appendChild(el);
  wrap.appendChild(tag);
  wrap.addEventListener('click', () => openLightbox(flatIdx));
  return wrap;
}


// ── LIGHTBOX ────────────────────────────────────────────────

function openLightboxFromHero() {
  openLightbox(heroFlatIndex);
}

function openLightbox(idx) {
  currentFlatIndex = Math.max(0, Math.min(idx, FLAT.length - 1));
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderLightboxFrame();
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
  const v = document.getElementById('lb-video');
  v.pause();
  v.src = '';
}

function stepLightbox(dir) {
  const next = currentFlatIndex + dir;
  if (next < 0 || next >= FLAT.length) return;
  currentFlatIndex = next;
  renderLightboxFrame();
}

function renderLightboxFrame() {
  const item   = FLAT[currentFlatIndex];
  if (!item) return;

  const lbImg   = document.getElementById('lb-img');
  const lbVideo = document.getElementById('lb-video');

  if (item.type === 'video') {
    lbImg.style.display   = 'none';
    lbVideo.style.display = 'block';
    lbVideo.src           = item.src;
    lbVideo.play();
  } else {
    lbVideo.style.display = 'none';
    lbVideo.pause();
    lbImg.style.display   = 'block';
    lbImg.src             = item.src;
    lbImg.alt             = item.caption || '';
  }

  document.getElementById('lb-caption').textContent = item.caption || '';
  document.getElementById('lb-meta').innerHTML = `
    <span class="tag-pill ${item.tag}">${item.tag}</span><br>
    ${item.time}<br>
    ${item.location}<br>
    ${item.weather}
  `;
  document.getElementById('lb-counter').textContent =
    `${currentFlatIndex + 1} / ${FLAT.length}`;
  document.getElementById('lb-prev').disabled = (currentFlatIndex === 0);
  document.getElementById('lb-next').disabled = (currentFlatIndex === FLAT.length - 1);
}

// Keyboard navigation
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'ArrowLeft')  stepLightbox(-1);
  if (e.key === 'ArrowRight') stepLightbox(1);
  if (e.key === 'Escape')     closeLightbox();
});

// Click backdrop to close
document.getElementById('lightbox').addEventListener('click', function (e) {
  if (e.target === this) closeLightbox();
});


// ── INIT ────────────────────────────────────────────────────

(async () => {
  const raw = await loadContent();
  DAYS = await processDays(raw);

  // Newest day first
  DAYS.sort((a, b) => b.date.localeCompare(a.date));

  // Flat index for lightbox navigation — chronological within each day
  FLAT = [];
  DAYS.forEach(day => day.images.forEach(img => FLAT.push(img)));

  initGrid();
  renderHero();
  renderTimeline();
})();
