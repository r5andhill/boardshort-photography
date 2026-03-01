const fs   = require('fs');
const path = require('path');

const DAYS_DIR = path.join(__dirname, 'content', 'days');
const OUTPUT   = path.join(__dirname, 'content', 'index.json');

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

function normalizeImage(img) {
  return {
    ...img,
    tag: img.tag || deriveTag(img.time),
  };
}

// dayMap: date string -> { date, location, images[] }
const dayMap = {};

const files = fs.existsSync(DAYS_DIR)
  ? fs.readdirSync(DAYS_DIR).filter(f => f.endsWith('.json')).sort()
  : [];

for (const file of files) {
  try {
    const raw  = fs.readFileSync(path.join(DAYS_DIR, file), 'utf8');
    const data = JSON.parse(raw);

    if (data.src) {
      // Sidecar format: flat single-image object
      const date = data.date;
      if (!date) { console.warn(`Skipping ${file}: no date field`); continue; }
      if (!dayMap[date]) dayMap[date] = { date, location: data.location || '', images: [] };
      dayMap[date].images.push(normalizeImage(data));
    } else if (Array.isArray(data.images)) {
      // Per-day format: day object with images array
      const date = data.date;
      if (!date) { console.warn(`Skipping ${file}: no date field`); continue; }
      if (!dayMap[date]) dayMap[date] = { date, location: data.location || '', images: [] };
      data.images.forEach(img => dayMap[date].images.push(normalizeImage(img)));
    } else {
      console.warn(`Skipping ${file}: unrecognized format`);
    }
  } catch (e) {
    console.warn(`Skipping ${file}: ${e.message}`);
  }
}

// Sort each day's images by time ascending
for (const day of Object.values(dayMap)) {
  day.images.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

// Sort days newest-first
const days = Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));

fs.writeFileSync(OUTPUT, JSON.stringify(days, null, 2));
console.log(`Built content/index.json — ${days.length} days, ${days.reduce((n, d) => n + d.images.length, 0)} images`);
