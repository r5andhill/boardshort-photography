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

let days = [];
if (fs.existsSync(DAYS_DIR)) {
  const files = fs.readdirSync(DAYS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(DAYS_DIR, file), 'utf8');
      const day = JSON.parse(raw);
      days.push(day);
    } catch(e) {
      console.warn(`Skipping ${file}: ${e.message}`);
    }
  }
}

fs.writeFileSync(OUTPUT, JSON.stringify(days, null, 2));
console.log(`Built content/index.json — ${days.length} days, ${days.reduce((n,d) => n + (d.images||[]).length, 0)} images`);
