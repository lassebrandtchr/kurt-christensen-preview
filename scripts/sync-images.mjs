// Synkroniserer studiebilleder til sitet.
//   Kilde:  ../assets/studio/<slug>/godkendt/*.png|jpg|webp  (KUN godkendte billeder;
//           filer direkte i assets/studio/<slug>/ er kladder og bruges aldrig)
//   Mål:    src/assets/cars/<slug>/<navn>.webp       (optimeret, maks. 2048 px bred)
//   Opdaterer images[] i src/content/cars/<slug>.json sorteret efter filnavn (første = cover).
//   Filerne i godkendt/ har et rækkefølge-præfiks. Filen der starter med "01_" (fx 01_front34.png)
//   er ALTID coverbilledet = bilen set skråt forfra (Lasses regel). Resten følger filnavnsorden.
//   (Valgfrit: scripts/image-order.json kan tvinge bestemte filer forrest.)
// Billeder fra assets/raw bruges ALDRIG.
// Kør:  npm run sync-images
import { readdir, readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const studioRoot = path.resolve(siteRoot, '..', 'assets', 'studio');
const carsOut = path.join(siteRoot, 'src', 'assets', 'cars');
const contentDir = path.join(siteRoot, 'src', 'content', 'cars');
const brandOut = path.join(siteRoot, 'src', 'assets', 'brand');

const MAX_WIDTH = 2048;
const orderFile = path.join(here, 'image-order.json');
const orderMap = existsSync(orderFile) ? JSON.parse(await readFile(orderFile, 'utf8')) : {};
const exts = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const collator = new Intl.Collator('da', { numeric: true, sensitivity: 'base' });

async function optimise(src, dest) {
  // Spring over hvis målet er nyere end kilden.
  if (existsSync(dest)) {
    const [s, d] = await Promise.all([stat(src), stat(dest)]);
    if (d.mtimeMs >= s.mtimeMs) return false;
  }
  await sharp(src)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 90, effort: 5 })
    .toFile(dest);
  return true;
}

// 1) Hero-billedet til forsiden (Skjoldet)
const heroSrc = path.join(studioRoot, '_proever', 'studio_ferrari_ext_3d.png');
await mkdir(brandOut, { recursive: true });
if (existsSync(heroSrc)) {
  const did = await optimise(heroSrc, path.join(brandOut, 'hero-studio.webp'));
  console.log(`hero: ${did ? 'opdateret' : 'uændret'}`);
} else {
  console.warn('hero-billede mangler: assets/studio/_proever/studio_ferrari_ext_3d.png (forsiden falder tilbage til logoet)');
}

// 2) Bilbilleder
const contentFiles = (await readdir(contentDir)).filter((f) => f.endsWith('.json'));
for (const file of contentFiles) {
  const slug = file.replace(/\.json$/, '');
  const jsonPath = path.join(contentDir, file);
  const car = JSON.parse(await readFile(jsonPath, 'utf8'));
  const srcDir = path.join(studioRoot, slug, 'godkendt');
  const outDir = path.join(carsOut, slug);

  let sources = [];
  if (existsSync(srcDir)) {
    sources = (await readdir(srcDir))
      .filter((f) => !f.startsWith('.') && !f.startsWith('_') && exts.has(path.extname(f).toLowerCase()))
      .sort(collator.compare);
  }

  await mkdir(outDir, { recursive: true });
  const wanted = new Set();
  let changed = 0;
  for (const name of sources) {
    const outName = name.replace(/\.[^.]+$/, '') + '.webp';
    wanted.add(outName);
    if (await optimise(path.join(srcDir, name), path.join(outDir, outName))) changed++;
  }
  // Fjern forældede filer
  for (const f of await readdir(outDir)) {
    if (!wanted.has(f)) await rm(path.join(outDir, f));
  }
  if (wanted.size === 0) await rm(outDir, { recursive: true, force: true });

  // Behold eksisterende alt-tekster
  const prevAlt = new Map((car.images ?? []).map((img) => [path.basename(img.src), img.alt]));
  const preferred = (Array.isArray(orderMap[slug]) ? orderMap[slug] : []).map((n) => `${n}.webp`);
  const isCover = (f) => /^0*1[_-]/.test(f);
  const rank = (f) => (isCover(f) ? -1 : preferred.includes(f) ? preferred.indexOf(f) : preferred.length);
  car.images = [...wanted].sort((a, b) => rank(a) - rank(b) || collator.compare(a, b)).map((outName) => {
    const entry = { src: `../../assets/cars/${slug}/${outName}` };
    const alt = prevAlt.get(outName);
    if (alt) entry.alt = alt;
    return entry;
  });
  await writeFile(jsonPath, JSON.stringify(car, null, 2) + '\n');
  const coverNote = car.images.length && !isCover(path.basename(car.images[0].src)) ? '  ADVARSEL: intet 01_-coverbillede (skråt forfra)' : '';
  console.log(`${slug}: ${car.images.length} billeder (${changed} optimeret)${coverNote}`);
}
