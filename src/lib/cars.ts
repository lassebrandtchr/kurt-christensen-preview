/**
 * Datalag for biler.
 *  - Er SANITY_PROJECT_ID sat (ved build), hentes bilerne fra Sanity via GROQ over HTTP.
 *  - Ellers læses den lokale content collection i src/content/cars/.
 * Begge kilder normaliseres til samme `Car`-form, så sider og komponenter er ligeglade med kilden.
 */
import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';

export type Univers = 'klassisk' | 'eksklusiv';
export type Status = 'til-salg' | 'reserveret' | 'solgt';

export type CarImage =
  | { kind: 'local'; src: ImageMetadata; alt: string }
  | { kind: 'remote'; url: string; width: number; height: number; alt: string };

export interface Spec {
  label: string;
  value: string | null;
  source: 'kurt' | 'model';
}

export interface Car {
  slug: string;
  make: string;
  model: string;
  variant: string | null;
  /** "Porsche 911 Turbo (997)" */
  name: string;
  year: number;
  km: number | null;
  price: number | null;
  priceNote: string | null;
  status: Status;
  univers: Univers;
  featured: boolean;
  fuel: string | null;
  gearbox: string | null;
  hp: number | null;
  engine: string | null;
  color: string | null;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  teaser: string;
  description: string;
  highlights: string[];
  specs: Spec[];
  images: CarImage[];
}

const env = import.meta.env as Record<string, string | undefined>;
const SANITY_PROJECT_ID = env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = env.SANITY_DATASET || process.env.SANITY_DATASET || 'production';
const SANITY_READ_TOKEN = env.SANITY_READ_TOKEN || process.env.SANITY_READ_TOKEN;

export const dataSource: 'sanity' | 'local' = SANITY_PROJECT_ID ? 'sanity' : 'local';

const carName = (make: string, model: string, variant?: string | null) =>
  [make, model, variant].filter(Boolean).join(' ');

const altFor = (c: { make: string; model: string; variant?: string | null; year: number; color?: string | null }, i: number, total: number) => {
  const base = `${carName(c.make, c.model, c.variant)} ${c.year}`;
  const color = c.color ? ` i ${c.color.split(' med ')[0].toLowerCase()}` : '';
  const pos = total > 1 ? ` – billede ${i + 1} af ${total}` : '';
  return `${base}${color}${pos} – Kurt Christensen, Bramming`;
};

function finalize(raw: Omit<Car, 'name' | 'seoTitle' | 'metaDescription' | 'h1' | 'teaser'> & Partial<Car>): Car {
  const name = carName(raw.make, raw.model, raw.variant);
  const sold = raw.status === 'solgt';
  return {
    ...raw,
    name,
    seoTitle: raw.seoTitle || `${name} ${raw.year}${sold ? ' – solgt' : ' til salg'} | Kurt Christensen`,
    metaDescription:
      raw.metaDescription ||
      `${name} fra ${raw.year}${raw.km != null ? ` med ${new Intl.NumberFormat('da-DK').format(raw.km)} km` : ''}. Se bilen hos Kurt Christensen i Bramming – ring 24 61 10 19.`,
    h1: raw.h1 || `${name} ${raw.year}`,
    teaser: raw.teaser || '',
  } as Car;
}

/* ---------------- Lokal content collection ---------------- */
async function fromCollection(): Promise<Car[]> {
  const entries = await getCollection('cars');
  return entries.map(({ data: d }) =>
    finalize({
      slug: d.slug,
      make: d.make,
      model: d.model,
      variant: d.variant ?? null,
      year: d.year,
      km: d.km ?? null,
      price: d.price ?? null,
      priceNote: d.priceNote ?? null,
      status: d.status,
      univers: d.univers,
      featured: d.featured ?? false,
      fuel: d.fuel ?? null,
      gearbox: d.gearbox ?? null,
      hp: d.hp ?? null,
      engine: d.engine ?? null,
      color: d.color ?? null,
      seoTitle: d.seoTitle ?? '',
      metaDescription: d.metaDescription ?? '',
      h1: d.h1 ?? '',
      teaser: d.teaser ?? '',
      description: d.description ?? '',
      highlights: d.highlights ?? [],
      specs: (d.specs ?? []).map((s) => ({ label: s.label, value: s.value ?? null, source: s.source ?? 'kurt' })),
      images: (d.images ?? []).map((img, i, arr) => ({
        kind: 'local' as const,
        src: img.src,
        alt: img.alt || altFor(d, i, arr.length),
      })),
    }),
  );
}

/* ---------------- Sanity (GROQ over HTTP, ingen SDK) ---------------- */
export const slugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

const GROQ = `*[_type == "car" && defined(make) && defined(year) && !(_id in path("drafts.**"))] | order(_createdAt desc){
  "slug": slug.current, make, model, variant, year, km, price, priceNote, status, univers, featured,
  fuel, gearbox, hp, engine, color, seoTitle, metaDescription, h1, teaser, description, highlights,
  specs[]{label, value, source},
  "cover": coverImage{alt, "url": asset->url, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height},
  images[]{alt, "url": asset->url, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height}
}`;

async function fromSanity(): Promise<Car[]> {
  const host = SANITY_READ_TOKEN ? 'api.sanity.io' : 'apicdn.sanity.io';
  const url = `https://${SANITY_PROJECT_ID}.${host}/v2024-01-01/data/query/${SANITY_DATASET}?query=${encodeURIComponent(GROQ)}`;
  const res = await fetch(url, {
    headers: SANITY_READ_TOKEN ? { Authorization: `Bearer ${SANITY_READ_TOKEN}` } : {},
  });
  if (!res.ok) throw new Error(`Sanity svarede ${res.status}: ${await res.text()}`);
  const { result } = (await res.json()) as { result: any[] };
  return (result ?? []).map((d) =>
    finalize({
      // Webadressen laves automatisk, hvis Kurt ikke har trykket "Generate" (samme regel som i Studio).
      slug: d.slug || slugify([d.make, d.model, d.variant, d.year].filter(Boolean).join(' ')),
      make: d.make ?? '',
      model: d.model ?? '',
      variant: d.variant ?? null,
      year: Number(d.year) || 0,
      km: d.km ?? null,
      price: d.price ?? null,
      priceNote: d.priceNote ?? null,
      status: (['til-salg', 'reserveret', 'solgt'].includes(d.status) ? d.status : 'til-salg') as Status,
      univers: (d.univers === 'eksklusiv' ? 'eksklusiv' : 'klassisk') as Univers,
      featured: Boolean(d.featured),
      fuel: d.fuel ?? null,
      gearbox: d.gearbox ?? null,
      hp: d.hp ?? null,
      engine: d.engine ?? null,
      color: d.color ?? null,
      seoTitle: d.seoTitle ?? '',
      metaDescription: d.metaDescription ?? '',
      h1: d.h1 ?? '',
      teaser: d.teaser ?? '',
      description: d.description ?? '',
      highlights: d.highlights ?? [],
      specs: (d.specs ?? []).map((s: any) => ({ label: s.label, value: s.value ?? null, source: s.source === 'model' ? 'model' : 'kurt' })),
      // Coverbilledet (skråt forfra) er altid første billede; derefter galleriet.
      images: [d.cover, ...(d.images ?? [])]
        .filter((img: any) => img?.url)
        .filter((img: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.url === img.url) === i)
        .map((img: any, i: number, arr: any[]) => ({
          kind: 'remote' as const,
          url: img.url,
          width: img.width ?? 1600,
          height: img.height ?? 1067,
          alt: img.alt || altFor(d, i, arr.length),
        })),
    }),
  );
}

/* ---------------- Offentligt API ---------------- */
let cache: Promise<Car[]> | null = null;

const statusRank: Record<Status, number> = { 'til-salg': 0, reserveret: 1, solgt: 2 };

/** Alle biler. Standardsortering: til salg før reserveret før solgt, derefter nyeste årgang. */
export function getCars(): Promise<Car[]> {
  if (!cache) {
    cache = (dataSource === 'sanity' ? fromSanity() : fromCollection()).then((cars) =>
      cars.sort((a, b) => statusRank[a.status] - statusRank[b.status] || b.year - a.year),
    );
  }
  return cache;
}

export async function getCarsByUnivers(u: Univers) {
  return (await getCars()).filter((c) => c.univers === u);
}

export function featuredCar(cars: Car[]): Car | undefined {
  const forSale = cars.filter((c) => c.status !== 'solgt');
  return (
    forSale.find((c) => c.featured) ??
    forSale.find((c) => c.images.length > 0) ??
    forSale[0]
  );
}

export function relatedCars(car: Car, cars: Car[], n = 3): Car[] {
  return cars
    .filter((c) => c.slug !== car.slug)
    .map((c) => ({
      c,
      score:
        (c.status === 'solgt' ? 100 : 0) +
        (c.make === car.make ? 0 : 10) +
        (c.univers === car.univers ? 0 : 5) +
        (car.price && c.price ? Math.abs(c.price - car.price) / 1_000_000 : 1),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, n)
    .map((x) => x.c);
}

export const statusLabel: Record<Status, string> = {
  'til-salg': 'Til salg',
  reserveret: 'Reserveret',
  solgt: 'Solgt',
};

export const universLabel: Record<Univers, string> = {
  klassisk: 'Klassisk',
  eksklusiv: 'Eksklusiv',
};

export const universPath: Record<Univers, string> = {
  klassisk: '/klassiske-biler/',
  eksklusiv: '/eksklusive-biler/',
};

/** Afgiftsstatus/prisnote vist under prisen. */
export function priceNoteText(car: Car): string {
  return car.priceNote || 'Afgiftsforhold: kontakt Kurt';
}
