import type { APIRoute } from 'astro';
import { u } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  // Preview-tilstand: luk for alle søgemaskiner.
  if (import.meta.env.PUBLIC_NOINDEX === 'true') {
    return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const sitemap = new URL(u('/sitemap-index.xml'), site ?? 'https://www.kurtchristensen.dk').href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
