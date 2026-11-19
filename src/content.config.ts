import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Lokal kilde til bilerne (én JSON-fil pr. bil i src/content/cars/).
 * Bruges når SANITY_PROJECT_ID ikke er sat. Sanity-skemaet i studio/ spejler dette.
 */
const cars = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/cars' }),
  schema: ({ image }) =>
    z.object({
      slug: z.string(),
      make: z.string(),
      model: z.string(),
      variant: z.string().nullable().optional(),
      year: z.number().int(),
      km: z.number().int().nullable().optional(),
      price: z.number().nullable().optional(),
      priceNote: z.string().nullable().optional(),
      status: z.enum(['til-salg', 'reserveret', 'solgt']),
      univers: z.enum(['klassisk', 'eksklusiv']),
      featured: z.boolean().optional().default(false),
      fuel: z.string().nullable().optional(),
      gearbox: z.string().nullable().optional(),
      hp: z.number().nullable().optional(),
      engine: z.string().nullable().optional(),
      color: z.string().nullable().optional(),
      seoTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      h1: z.string().optional(),
      teaser: z.string().optional(),
      description: z.string().optional().default(''),
      highlights: z.array(z.string()).optional().default([]),
      specs: z
        .array(
          z.object({
            label: z.string(),
            value: z.string().nullable(),
            source: z.enum(['kurt', 'model']).optional().default('kurt'),
          }),
        )
        .optional()
        .default([]),
      images: z
        .array(z.object({ src: image(), alt: z.string().optional() }))
        .optional()
        .default([]),
      notes: z
        .object({ lookedFor: z.string().optional(), found: z.string().optional(), verdict: z.string().optional() })
        .optional(),
      /** Sti til lydfil i public/, fx "/lyd/bil.m4a" */
      audio: z.string().optional(),
    }),
});

export const collections = { cars };
