// Seeder content collection'en `cars` (én JSON-fil pr. bil) fra ../research/cars.json.
// Overskriver ikke eksisterende filer, medmindre `--force` gives (billeder bevares altid).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const source = path.resolve(siteRoot, '..', 'research', 'cars.json');
const outDir = path.join(siteRoot, 'src', 'content', 'cars');
const force = process.argv.includes('--force');

const statusMap = { 'til salg': 'til-salg', reserveret: 'reserveret', solgt: 'solgt' };

const cars = JSON.parse(await readFile(source, 'utf8'));
await mkdir(outDir, { recursive: true });

for (const car of cars) {
  const file = path.join(outDir, `${car.slug}.json`);
  let images = [];
  if (existsSync(file)) {
    const existing = JSON.parse(await readFile(file, 'utf8'));
    images = existing.images ?? [];
    if (!force) {
      console.log(`springer over (findes): ${car.slug}`);
      continue;
    }
  }
  const status = statusMap[String(car.status).toLowerCase()] ?? 'til-salg';
  const entry = {
    slug: car.slug,
    make: car.make,
    model: car.model,
    variant: car.variant ?? null,
    year: car.year,
    km: car.km ?? null,
    price: car.price ?? null,
    priceNote: car.priceNote ?? null,
    status,
    univers: car.univers,
    featured: false,
    fuel: car.fuel ?? null,
    gearbox: car.gearbox ?? null,
    hp: car.hp ?? null,
    engine: car.engine ?? null,
    color: car.color ?? null,
    seoTitle: car.seoTitle,
    metaDescription: car.metaDescription,
    h1: car.h1,
    teaser: car.teaser,
    description: car.description,
    highlights: car.highlights ?? [],
    specs: car.specs ?? [],
    images,
  };
  await writeFile(file, JSON.stringify(entry, null, 2) + '\n');
  console.log(`skrev ${path.relative(siteRoot, file)} (${status})`);
}
