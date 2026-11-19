export const SITE = {
  name: 'Kurt Christensen – klassiske og eksklusive biler',
  shortName: 'Kurt Christensen',
  tagline: 'Vi handler med klassiske og eksklusive biler',
  phone: '24 61 10 19',
  phoneHref: 'tel:+4524611019',
  phoneIntl: '+45 24 61 10 19',
  email: 'porsche993@jubii.dk',
  street: 'Ribevej 11',
  postalCode: '6740',
  city: 'Bramming',
  country: 'DK',
  region: 'Syddanmark',
  // Omtrentlige koordinater for Bramming by (bruges kun i JSON-LD som område-angivelse).
  geo: { lat: 55.4657, lng: 8.7027 },
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ribevej+11%2C+6740+Bramming',
  directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Ribevej+11%2C+6740+Bramming',
  osmUrl: 'https://www.openstreetmap.org/search?query=Ribevej%2011%2C%206740%20Bramming',
  facebook: 'https://www.facebook.com/profile.php?id=61596193697160',
} as const;

export const nf = new Intl.NumberFormat('da-DK');
export const formatPrice = (n?: number | null) => (n == null ? null : `${nf.format(n)} kr.`);
export const formatKm = (n?: number | null) => (n == null ? null : `${nf.format(n)} km`);

/** Base-sti (fx "/kurt-christensen-preview" på GitHub Pages, "" på eget domæne). */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
/** Gør en rod-relativ sti ("/kontakt/") base-sikker. Andre værdier (tel:, https:, #) røres ikke. */
export const u = (p: string) => (p.startsWith('/') && !p.startsWith('//') ? BASE + p : p);
/** Fjerner base-stien fra en pathname (til aktiv-markering i menuen). */
export const stripBase = (p: string) => (BASE && p.startsWith(BASE) ? p.slice(BASE.length) || '/' : p);
