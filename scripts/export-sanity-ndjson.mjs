// Eksporterer de lokale biler (src/content/cars/*.json) til NDJSON, så de kan importeres i Sanity:
//   cd studio && npx sanity dataset import seed/cars.ndjson production
// Billederne kommer med: de optimerede studiebilleder i src/assets/cars/<slug>/ uploades ved import
// (01_ = "Forsidebillede (skråt forfra)", resten = galleri). Kør `npm run sync-images` først.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, '..', 'src', 'content', 'cars');
const out = path.resolve(here, '..', 'studio', 'seed', 'cars.ndjson');
const carsAssets = path.resolve(here, '..', 'src', 'assets', 'cars');
const key = (i) => `k${i.toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const lines = [];
for (const f of (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()) {
  const c = JSON.parse(await readFile(path.join(dir, f), 'utf8'));
  const doc = {
    _id: `car-${c.slug}`,
    _type: 'car',
    slug: { _type: 'slug', current: c.slug },
    univers: c.univers,
    status: c.status,
    make: c.make,
    model: c.model,
    variant: c.variant ?? undefined,
    year: c.year,
    km: c.km ?? undefined,
    price: c.price ?? undefined,
    priceNote: c.priceNote ?? undefined,
    featured: Boolean(c.featured),
    fuel: c.fuel ?? undefined,
    gearbox: c.gearbox ?? undefined,
    hp: c.hp ?? undefined,
    engine: c.engine ?? undefined,
    color: c.color ?? undefined,
    h1: c.h1,
    teaser: c.teaser,
    description: c.description,
    highlights: c.highlights ?? [],
    specs: (c.specs ?? []).map((s, i) => ({ _key: key(i), _type: 'spec', label: s.label, value: s.value ?? undefined, source: s.source })),
    seoTitle: c.seoTitle,
    metaDescription: c.metaDescription,
  };
  const imgs = (c.images ?? []).map((img) => ({ file: path.resolve(carsAssets, c.slug, path.basename(img.src)), alt: img.alt }))
    .filter((img) => existsSync(img.file));
  const asImage = (img, i) => ({
    ...(i === undefined ? {} : { _key: key(i) }),
    _type: 'image',
    _sanityAsset: `image@${pathToFileURL(img.file).href}`,
    ...(img.alt ? { alt: img.alt } : {}),
  });
  if (imgs.length) {
    doc.coverImage = asImage(imgs[0]);
    doc.images = imgs.slice(1).map((img, i) => asImage(img, i));
  }
  lines.push(JSON.stringify(doc));
}
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, lines.join('\n') + '\n');
console.log(`Skrev ${lines.length} biler (med billeder) til ${path.relative(process.cwd(), out)}`);
