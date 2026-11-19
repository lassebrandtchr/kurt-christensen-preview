import { u } from './site';
import { SITE } from './site';
import type { Car } from './cars';

export const dealerId = (site: URL | string) => new URL(u('/#autodealer'), site).href;

export function autoDealer(site: URL | string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    '@id': dealerId(site),
    name: SITE.name,
    alternateName: SITE.shortName,
    slogan: SITE.tagline,
    url: new URL(u('/'), site).href,
    telephone: SITE.phoneIntl,
    email: SITE.email,
    image: new URL(u('/og-default.jpg'), site).href,
    logo: new URL(u('/og-default.jpg'), site).href,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.street,
      postalCode: SITE.postalCode,
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      addressCountry: SITE.country,
    },
    areaServed: ['Bramming', 'Esbjerg', 'Ribe', 'Sydjylland', 'Danmark'],
    sameAs: [SITE.facebook],
  };
}

export function breadcrumbs(site: URL | string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: new URL(u(it.path), site).href,
    })),
  };
}

export function carSchema(site: URL | string, car: Car, imageUrls: string[]) {
  const url = new URL(u(`/biler/${car.slug}/`), site).href;
  const sold = car.status === 'solgt';
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    '@id': `${url}#car`,
    name: `${car.name} ${car.year}`,
    url,
    brand: { '@type': 'Brand', name: car.make },
    model: [car.model, car.variant].filter(Boolean).join(' '),
    vehicleModelDate: String(car.year),
    description: car.metaDescription,
    itemCondition: 'https://schema.org/UsedCondition',
  };
  if (imageUrls.length) data.image = imageUrls;
  if (car.km != null) data.mileageFromOdometer = { '@type': 'QuantitativeValue', value: car.km, unitCode: 'KMT' };
  if (car.color) data.color = car.color;
  if (car.fuel) data.fuelType = car.fuel;
  if (car.gearbox) data.vehicleTransmission = car.gearbox;
  if (car.engine || car.hp) {
    data.vehicleEngine = {
      '@type': 'EngineSpecification',
      ...(car.engine ? { name: car.engine } : {}),
      ...(car.hp ? { enginePower: { '@type': 'QuantitativeValue', value: car.hp, unitText: 'hk' } } : {}),
    };
  }
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    url,
    priceCurrency: 'DKK',
    availability: sold
      ? 'https://schema.org/SoldOut'
      : car.status === 'reserveret'
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/UsedCondition',
    seller: { '@id': dealerId(site) },
  };
  if (!sold && car.price != null) offer.price = car.price;
  data.offers = offer;
  return data;
}
