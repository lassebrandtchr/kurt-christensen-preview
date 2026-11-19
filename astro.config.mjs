// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

// Sæt PUBLIC_SITE_URL i .env eller hos hosting (fx https://www.kurtchristensen.dk). Bruges til canonical, OG og sitemap.
// Konfigurationen læses før Astro indlæser .env, derfor loadEnv her.
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const site = env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://www.kurtchristensen.dk';
// Undermappe ved hosting under en sti (fx GitHub Pages: /kurt-christensen-preview). Tom på eget domæne.
const base = env.SITE_BASE || process.env.SITE_BASE || undefined;

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  image: {
    domains: ['cdn.sanity.io'],
  },
  build: {
    format: 'directory',
  },
});
