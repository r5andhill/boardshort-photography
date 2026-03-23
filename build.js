const fs   = require('fs');
const path = require('path');

const DAYS_DIR      = path.join(__dirname, 'content', 'days');
const OUTPUT        = path.join(__dirname, 'content', 'index.json');
const HERO_MANIFEST = path.join(__dirname, 'hero-manifest.json');

if (!fs.existsSync(path.join(__dirname, 'content'))) {
  fs.mkdirSync(path.join(__dirname, 'content'), { recursive: true });
}
if (!fs.existsSync(DAYS_DIR)) {
  fs.mkdirSync(DAYS_DIR, { recursive: true });
}

function deriveTag(time) {
  if (!time) return 'sunrise';
  const [h, m] = time.split(':').map(Number);
  return (h + m / 60) < 12 ? 'sunrise' : 'sunset';
}

// dayMap: date string -> { date, location, images[] }
const dayMap       = {};
const heroManifest = [];

const files = fs.existsSync(DAYS_DIR)
  ? fs.readdirSync(DAYS_DIR).filter(f => f.endsWith('.json')).sort()
  : [];

for (const file of files) {
  try {
    const raw  = fs.readFileSync(path.join(DAYS_DIR, file), 'utf8');
    const data = JSON.parse(raw);

    if (!data.src) { console.warn(`Skipping ${file}: no src field`); continue; }
    const date = data.date;
    if (!date) { console.warn(`Skipping ${file}: no date field`); continue; }

    const img = { ...data, tag: data.tag || deriveTag(data.time) };

    if (!dayMap[date]) dayMap[date] = { date, location: data.location || '', images: [] };
    dayMap[date].images.push(img);

    if (img.hero === true || img.hero === 'true') {
      heroManifest.push({ src: img.src, sidecar: `content/days/${file}` });
    }
  } catch (e) {
    console.warn(`Skipping ${file}: ${e.message}`);
  }
}

// Sort each day's images by time ascending (direct string comparison)
for (const day of Object.values(dayMap)) {
  day.images.sort((a, b) => {
    const ta = a.time || '';
    const tb = b.time || '';
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });
}

// Sort days newest-first (direct string comparison)
const days = Object.values(dayMap).sort((a, b) =>
  a.date > b.date ? -1 : a.date < b.date ? 1 : 0
);

fs.writeFileSync(OUTPUT, JSON.stringify(days, null, 2));
fs.writeFileSync(HERO_MANIFEST, JSON.stringify(heroManifest, null, 2));
console.log(`Built content/index.json — ${days.length} days, ${days.reduce((n, d) => n + d.images.length, 0)} images`);
console.log(`Built hero-manifest.json — ${heroManifest.length} hero images`);
