import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Bil – spejler content collection'en i src/content.config.ts.
 * Designet ligger i koden; her udfylder Kurt kun indhold.
 */
export const car = defineType({
  name: 'car',
  title: 'Bil',
  type: 'document',
  groups: [
    { name: 'grund', title: 'Grunddata', default: true },
    { name: 'billeder', title: 'Billeder' },
    { name: 'tekst', title: 'Tekst' },
    { name: 'kurt', title: 'Kurts noter & lyd' },
    { name: 'specs', title: 'Specifikationer' },
    { name: 'seo', title: 'SEO' },
  ],
  fieldsets: [
    { name: 'detaljer', title: 'Flere detaljer (valgfrit)', description: 'Udfyld det, du kender. Tomme felter vises som "Kontakt Kurt".', options: { collapsible: true, collapsed: true } },
    { name: 'avanceret', title: 'Avanceret (behøver du sjældent røre)', options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: 'univers',
      title: 'Univers',
      type: 'string',
      group: 'grund',
      description: 'Hvor skal bilen bo? Klassisk = ældre biler med patina. Eksklusiv = moderne sportsvogne og GT.',
      options: { list: [{ title: 'Klassisk', value: 'klassisk' }, { title: 'Eksklusiv', value: 'eksklusiv' }], layout: 'radio', direction: 'horizontal' },
      validation: (r) => r.required().error('Vælg et univers'),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'grund',
      initialValue: 'til-salg',
      description: 'Sæt til "Solgt" når bilen er solgt – så flytter den til "Solgte biler" i stedet for at forsvinde.',
      options: { list: [{ title: 'Til salg', value: 'til-salg' }, { title: 'Reserveret', value: 'reserveret' }, { title: 'Solgt', value: 'solgt' }], layout: 'radio', direction: 'horizontal' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'make', title: 'Mærke', type: 'string', group: 'grund', description: 'Fx Porsche', validation: (r) => r.required() }),
    defineField({ name: 'model', title: 'Model', type: 'string', group: 'grund', description: 'Fx 911', validation: (r) => r.required() }),
    defineField({ name: 'variant', title: 'Variant', type: 'string', group: 'grund', description: 'Fx Turbo (997). Valgfri.' }),
    defineField({ name: 'year', title: 'Årgang', type: 'number', group: 'grund', validation: (r) => r.required().integer().min(1900).max(2100) }),
    defineField({ name: 'km', title: 'Kilometer', type: 'number', group: 'grund', description: 'Kun tal, fx 72000. Tomt = vises som "Kontakt Kurt".' }),
    defineField({ name: 'price', title: 'Pris (kr.)', type: 'number', group: 'grund', description: 'Kun tal, fx 650000. Tomt = "Pris efter aftale".' }),
    defineField({
      name: 'priceNote',
      title: 'Afgiftsstatus / prisnote',
      type: 'string',
      group: 'grund',
      description: 'Vises under prisen. Tomt = "Afgiftsforhold: kontakt Kurt".',
      options: { list: ['Inkl. dansk afgift', 'Prisen er uden dansk registreringsafgift'] },
    }),
    defineField({ name: 'fuel', fieldset: 'detaljer', title: 'Drivmiddel', type: 'string', group: 'grund', options: { list: ['Benzin', 'Diesel', 'Hybrid', 'El'] } }),
    defineField({ name: 'gearbox', fieldset: 'detaljer', title: 'Gearkasse', type: 'string', group: 'grund', description: 'Fx Manuel, Automatisk, PDK. Tomt = "Kontakt Kurt".' }),
    defineField({ name: 'hp', fieldset: 'detaljer', title: 'Hestekræfter', type: 'number', group: 'grund' }),
    defineField({ name: 'engine', fieldset: 'detaljer', title: 'Motor', type: 'string', group: 'grund', description: 'Fx 3,6 biturbo boxer' }),
    defineField({ name: 'color', fieldset: 'detaljer', title: 'Farve', type: 'string', group: 'grund', description: 'Fx Rød med interiør i sort/rødt læder' }),
    defineField({
      name: 'slug',
      title: 'Webadresse',
      type: 'slug',
      group: 'grund',
      fieldset: 'avanceret',
      description: 'Lad den være tom – adressen laves automatisk ud fra mærke, model og årgang. Tryk kun "Generate", hvis du vil låse adressen.',
      options: {
        source: (doc: any) => [doc.make, doc.model, doc.variant, doc.year].filter(Boolean).join(' '),
        slugify: (input: string) =>
          input.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80),
      },
    }),
    defineField({ name: 'featured', title: 'Fremhæv på forsiden', type: 'boolean', group: 'grund', fieldset: 'avanceret', initialValue: false, description: 'Vises som "Udvalgt bil" på forsiden (én ad gangen).' }),

    defineField({
      name: 'rawImages',
      title: 'Råbilleder (fra mobilen)',
      type: 'array',
      group: 'billeder',
      description:
        'Træk alle dine mobilbilleder af bilen herind på én gang. De vises IKKE på hjemmesiden – de bruges til at lave studiebillederne. Indtil studiebillederne er klar, viser siden et pænt "billeder på vej"-felt.',
      of: [defineArrayMember({ type: 'image' })],
      options: { layout: 'grid' },
    }),
    defineField({
      name: 'coverImage',
      title: 'Forsidebillede (skråt forfra)',
      type: 'image',
      group: 'billeder',
      description:
        'VIGTIGT: Vælg et billede af bilen set SKRÅT FORFRA (front + den ene side). Det bruges som første billede på bilkortet og i alle oversigter.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Billedtekst (alt)', type: 'string', description: 'Fx "Ferrari 308 GTS 1978 i rød, set skråt forfra". Tomt = laves automatisk.' })],
      validation: (r) => r.required().warning('Husk et studiebillede skråt forfra, når det er klar – indtil da vises "billeder på vej".'),
    }),
    defineField({
      name: 'images',
      title: 'Galleri',
      type: 'array',
      group: 'billeder',
      description: 'Resten af studiebillederne. Træk flere filer herind på én gang, og træk i billederne for at ændre rækkefølgen. Forsidebilledet skal ikke uploades igen her.',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'Billedtekst (alt)', type: 'string' })],
        }),
      ],
      options: { layout: 'grid' },
    }),

    defineField({ name: 'h1', title: 'Overskrift på bilkortet', type: 'string', group: 'tekst', description: 'Fx "Porsche 911 Turbo (997) 2007 – 480 hk, grå". Tomt = mærke, model og årgang.' }),
    defineField({ name: 'teaser', title: 'Kort tekst (1–2 linjer)', type: 'text', rows: 3, group: 'tekst', validation: (r) => r.max(220) }),
    defineField({
      name: 'description',
      title: 'Salgsbeskrivelse',
      type: 'text',
      rows: 20,
      group: 'tekst',
      description: 'Skriv almindelige afsnit med en tom linje imellem. "## " foran en linje = overskrift, "- " foran = punkt i en liste.',
    }),
    defineField({ name: 'highlights', title: 'Højdepunkter', type: 'array', group: 'tekst', of: [defineArrayMember({ type: 'string' })] }),

    defineField({
      name: 'noteLookedFor',
      title: 'Det kiggede jeg efter',
      type: 'text',
      rows: 3,
      group: 'kurt',
      description: 'Med dine egne ord, 1–2 sætninger: hvad du som mekaniker tjekkede på netop denne bil. Vises som en håndskrevet note på bilen. Tomt = noten vises ikke.',
      validation: (r) => r.max(260).warning('Hold den kort – 1–2 sætninger.'),
    }),
    defineField({
      name: 'noteFound',
      title: 'Det fandt jeg',
      type: 'text',
      rows: 3,
      group: 'kurt',
      description: 'Med dine egne ord, 1–2 sætninger: hvad du fandt – også det mindre gode. Ærlighed sælger.',
      validation: (r) => r.max(260).warning('Hold den kort – 1–2 sætninger.'),
    }),
    defineField({
      name: 'noteVerdict',
      title: 'Min vurdering (valgfri)',
      type: 'string',
      group: 'kurt',
      description: 'Én linje, fx "En af de pæneste, jeg har haft inde."',
      validation: (r) => r.max(140),
    }),
    defineField({
      name: 'coldStart',
      title: 'Koldstart (lyd fra mobilen)',
      type: 'file',
      group: 'kurt',
      description: 'Optag bilen, når den starter kold (ca. 15–30 sekunder, mobilen 1–2 meter fra udstødningen). Træk lydfilen herind. Tomt = afspilleren vises ikke.',
      options: { accept: 'audio/*' },
    }),

    defineField({
      name: 'specs',
      title: 'Specifikationer',
      type: 'array',
      group: 'specs',
      description: 'Én linje pr. oplysning. Skriv "Kontakt Kurt" hvis den ikke er kendt – gæt aldrig.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'spec',
          fields: [
            defineField({ name: 'label', title: 'Felt', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'value', title: 'Værdi', type: 'string' }),
            defineField({
              name: 'source',
              title: 'Kilde',
              type: 'string',
              initialValue: 'kurt',
              options: { list: [{ title: 'Kurt (den konkrete bil)', value: 'kurt' }, { title: 'Typisk for modellen', value: 'model' }], layout: 'radio' },
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'value' } },
        }),
      ],
    }),

    defineField({ name: 'seoTitle', title: 'SEO-titel', type: 'string', group: 'seo', description: 'Maks. ca. 60 tegn. Tomt = laves automatisk.', validation: (r) => r.max(70) }),
    defineField({ name: 'metaDescription', title: 'Meta-beskrivelse', type: 'text', rows: 3, group: 'seo', description: 'Maks. ca. 155 tegn.', validation: (r) => r.max(170) }),
  ],
  orderings: [
    { title: 'Nyeste først', name: 'createdDesc', by: [{ field: '_createdAt', direction: 'desc' }] },
    { title: 'Årgang', name: 'yearDesc', by: [{ field: 'year', direction: 'desc' }] },
  ],
  preview: {
    select: { make: 'make', model: 'model', variant: 'variant', year: 'year', status: 'status', univers: 'univers', media: 'coverImage' },
    prepare: ({ make, model, variant, year, status, univers, media }) => ({
      title: [make, model, variant].filter(Boolean).join(' ') + (year ? ` ${year}` : ''),
      subtitle: `${univers === 'eksklusiv' ? 'Eksklusiv' : 'Klassisk'} · ${status === 'solgt' ? 'SOLGT' : status === 'reserveret' ? 'Reserveret' : 'Til salg'}`,
      media,
    }),
  },
});
