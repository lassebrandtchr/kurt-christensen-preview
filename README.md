# Kurt Christensen – klassiske og eksklusive biler

Statisk hjemmeside bygget med **Astro 7**, vanilla CSS (design-tokens i `src/styles/global.css`), lidt vanilla JS og **GSAP** til signatur-animationerne. Fonte (Archivo + Newsreader) er self-hostet via Fontsource. Ingen cookies, ingen sporing.

## Kom i gang (lokalt)

```bash
cd site
npm install
npm run dev        # http://localhost:4321
npm run build      # bygger til dist/
npm run preview    # viser dist/ lokalt
```

Kopiér `.env.example` til `.env` og udfyld efter behov. Uden `.env` virker alt, bortset fra at formularerne viser en fejl ("kunne ikke sendes – ring til Kurt") i stedet for at sende.

| Variabel | Bruges til |
|---|---|
| `PUBLIC_SITE_URL` | Domænet (canonical, OG, sitemap). Standard: `https://www.kurtchristensen.dk` |
| `PUBLIC_FORMSPREE_ID` | Formspree-formularens ID (fx `xyzabcd`) |
| `SANITY_PROJECT_ID` | Sættes den, hentes bilerne fra Sanity i stedet for `src/content/cars/` |
| `SANITY_DATASET` | Standard `production` |
| `SANITY_READ_TOKEN` | Kun hvis datasættet er privat. Gemmes i hostingens miljøvariabler, aldrig i repoet |
| `PUBLIC_NOINDEX` | `true` = preview: `noindex, nofollow` på alle sider og `Disallow: /` i robots.txt |
| `SITE_BASE` | Undermappe, når sitet ligger under en sti (fx `/kurt-christensen-preview`). Tom på eget domæne |

## Preview til fremvisning (GitHub Pages)

Adresse: https://lassebrandtchr.github.io/kurt-christensen-preview/ (repo `lassebrandtchr/kurt-christensen-preview`, offentligt). Sitet er lukket for søgemaskiner (`noindex, nofollow` + `Disallow: /`), men alle med linket kan se det.

```bash
npm run deploy:preview   # bygger fra Sanity med base-sti + noindex og pusher til grenen gh-pages
```

Kør den igen, når Kurt har ændret noget i Sanity; preview'et opdaterer ikke sig selv. Kildekoden ligger på `main`. Alle interne links går gennem `u()` i `src/lib/site.ts`, så sitet virker både i undermappe og på eget domæne. GitHub Pages er kun til fremvisning; det rigtige site skal på Netlify eller Cloudflare.

## Sider

| URL | Indhold |
|---|---|
| `/` | Hero "Skjoldet", marquee, to univers-portaler, udvalgt bil, alle biler på lager (med univers-mærke), Hvorfor Kurt, solgte biler, CTA |
| `/klassiske-biler/` | Det klassiske univers (creme papir, serif, filmkorn, stempler, blød bevægelse) |
| `/eksklusive-biler/` | Det eksklusive univers (sort/guld/sølv, bred Archivo, præcis bevægelse) |
| `/biler-til-salg/` | Alle biler, filtre (univers, mærke, til salg/solgte) + sortering. Årgang/pris-filtre vises først når der er mere end 8 biler til salg |
| `/biler/<slug>/` | Bilkort i bilens univers: galleri + lightbox, prisboks, nøgletal, specs, beskrivelse, forespørgsel, relaterede biler |
| `/om-kurt/` | Om Kurt + `#solgte-biler` |
| `/kontakt/` | Kontaktinfo, formular, skematisk kort (ingen Google-embed = ingen cookies) |
| `/privatlivspolitik/` | Kort privatlivspolitik (skal godkendes af Kurt) |

## Biler og billeder

Bilerne ligger som én JSON-fil pr. bil i `src/content/cars/` (skemaet står i `src/content.config.ts`). De blev seedet fra `../research/cars.json` med `npm run seed` (overskriver ikke eksisterende filer; `npm run seed -- --force` overskriver tekster, men bevarer billederne).

**Billeder:** Kun godkendte studiebilleder bruges. De ligger i `../assets/studio/<slug>/godkendt/`.

```bash
npm run sync-images
```

- Scriptet læser KUN `assets/studio/<slug>/godkendt/*.png|jpg|webp`. Kladder direkte i `assets/studio/<slug>/` og alt i `assets/raw/` bruges aldrig.
- Billederne optimeres til WebP i `src/assets/cars/<slug>/`, og bilens `images[]` opdateres sorteret efter filnavn.
- **Coverbilledet er altid filen der starter med `01_`** (fx `01_front34.png`). Det skal være bilen set skråt forfra. Scriptet advarer, hvis det mangler.
- **Logo:** sitet bruger `src/assets/brand/logo-transparent.png` (baggrunden gjort gennemsigtig med `node scripts/logo-to-alpha.mjs`; selve logoet er uændret). Det virker kun på mørk baggrund. Originalen `logo.png` bevares.
- Forsidens hero er `assets/studio/_proever/studio_ferrari_ext_3d.png` (godkendt af Lasse). Den kopieres til `src/assets/brand/hero-studio.webp`.
- En bil uden billeder får automatisk en placeholder med logoet ("Studiebilleder på vej"), aldrig et brudt billede.
- Ved build laver Astro AVIF + WebP i flere bredder (srcset, lazy loading).

Kør `npm run sync-images` og derefter `npm run build`, hver gang der kommer nye godkendte billeder.

## Formularer (Formspree)

**Status (2026-11-19):** Kontoen er Lasses (gratisplan, 50 henvendelser/md.). Formularen hedder "Kurt Christensen – hjemmeside", ID `xrpqlvbw` (står i `.env`; skal også sættes hos hosting). Testet lokalt: indsendelsen nåede Formspree.

1. Modtager er midlertidigt Lasses mail. Kurts mail (porsche993@jubii.dk) er tilføjet som "Linked Email", og Formspree har sendt ham et bekræftelseslink.
2. Når Kurt har klikket på linket: Formspree → formularen → **Settings** → skift modtager til porsche993@jubii.dk.
3. Alle tre formularer (kontakt, forespørgsel på bil, sælg din bil) poster til den samme formular. Feltet `formular` og emnelinjen viser, hvilken det er.
4. Tjek fanen **Spam** i Formspree den første tid; testbeskeden med en example.com-adresse havnede der.

Spam-beskyttelse: honeypot-feltet `_gotcha`. Validering sker i browseren med danske fejlbeskeder.

> **Ingen "Sælg din bil"-side (Lasses beslutning 2026-11-19).** Har en kunde en unik klassisk eller eksklusiv bil, bruger de kontaktformularen med emnet "Jeg har en unik bil", og Kurt tager selv stilling. Forsiden linker dertil med emnet udfyldt (`/kontakt/?emne=…`).

## CMS: Sanity (så Kurt selv kan tilføje biler)

Studiet ligger i `site/studio/` og har sin egen `package.json`. Det installeres ikke sammen med sitet. Skemaet spejler content collection'en, inkl. **univers**, **status** og et påkrævet felt **"Forsidebillede (skråt forfra)"** ud over galleriet.

### Lasses opsætning (gratis plan, én gang)

**Status (2026-11-19):** Trin 1–4 er gjort. Projekt "Kurt Christensen biler", Project ID `vn1kgmwg`, dataset `production` (offentligt), ejet af Lasses konto. Sanity kører 30 dages prøveperiode på betalte funktioner og falder derefter til gratisplanen. De 6 biler og alle 29 studiebilleder er importeret, og `site/.env` peger på Sanity, så sitet bygger fra Sanity. Mangler: trin 5, 6 og 8 samt deploy hook.

1. Opret en gratis konto på sanity.io og et nyt projekt (dataset: `production`). Notér **Project ID**.
2. Lav `studio/.env` ud fra `studio/.env.example` og sæt `SANITY_STUDIO_PROJECT_ID`.
3. Installér og start studiet:
   ```bash
   cd site/studio
   npm install
   npm run dev          # Studio på http://localhost:3333
   ```
4. Importér de 6 nuværende biler med billeder (kør `npm run sync-images` i `site/` først):
   ```bash
   npm run seed         # = eksporter NDJSON + sanity dataset import
   ```
5. Udgiv studiet, så Kurt kan logge ind fra browseren: `npm run deploy` → `https://kurt-christensen.sanity.studio`.
6. Inviter Kurt som **Editor** under sanity.io/manage → Members.
7. CORS: ikke nødvendigt for sitet, fordi det kun henter fra Sanity ved build (server-side). `http://localhost:3333` er tilladt til det lokale Studio, og `*.sanity.studio` er tilladt automatisk. Tilføj kun sitets domæne, hvis der senere kommer browser-kald til Sanity.
8. Sæt `SANITY_PROJECT_ID` (og `SANITY_DATASET`) som miljøvariabler hos hosting. Fra næste build læser sitet fra Sanity. Er datasættet privat, så sæt også `SANITY_READ_TOKEN` (en Viewer-token).

### Deploy hook (automatisk genopbygning når Kurt gemmer)

1. Hos hosting (fx Netlify: Site settings → Build & deploy → Build hooks, eller Vercel: Settings → Git → Deploy Hooks) oprettes en build hook. Den giver en hemmelig URL; den må ikke ligge i repoet.
2. I sanity.io/manage → API → Webhooks: opret en webhook.
   - URL: build hook-URL'en
   - Trigger on: Create, Update, Delete
   - Filter: `_type == "car"`
   - HTTP method: POST
3. Når Kurt udgiver en ændring, bygges sitet automatisk igen (1–2 minutter).

Build-indstillinger hos hosting: base directory `site`, build command `npm run build`, publish directory `site/dist`.

### Sådan tilføjer Kurt en bil

1. Log ind på `https://kurt-christensen.sanity.studio`.
2. Klik **Alle biler** → **+ (Opret)**.
3. **Grunddata:** vælg **Univers** (Klassisk / Eksklusiv) og **Status** (Til salg). Udfyld mærke, model, variant, årgang, km og pris. Tryk **Generate** ved "Webadresse". Ukendte felter lades tomme; de vises som "Kontakt Kurt". Gæt aldrig.
4. **Billeder:** upload først **Forsidebillede (skråt forfra)**, altså bilen set skråt forfra. Træk derefter resten af studiebillederne ind i **Galleri**, og træk dem i den rækkefølge de skal vises.
5. **Tekst:** kort tekst (1–2 linjer), salgsbeskrivelse og højdepunkter.
6. **Specifikationer:** én linje pr. oplysning, med kilde "Kurt" eller "Typisk for modellen".
7. Tryk **Publish**. Bilen er på sitet efter et par minutter.

**Når en bil er solgt:** sæt Status til **Solgt** og tryk Publish. Bilen flytter til "Solgte biler" og viser ingen pris. Slet den ikke; den virker som reference og holder sin webadresse.

## SEO

- Unik title, meta description, canonical og Open Graph pr. side (`src/layouts/BaseLayout.astro`).
- JSON-LD: `AutoDealer` på alle sider, `Car` + `Offer` på hvert bilkort (InStock / SoldOut, ingen pris på solgte), `BreadcrumbList`, `ItemList` på lagersiden.
- `sitemap-index.xml` (@astrojs/sitemap) og `robots.txt` (`src/pages/robots.txt.ts`). Begge bruger `PUBLIC_SITE_URL`.
- `lang="da"`, alt-tekster efter mønsteret "[Mærke model årgang] i [farve] – billede n af N – Kurt Christensen, Bramming".

## Ting Kurt skal bekræfte, før siden går live

- Baggrund og år i branchen, personlig passion, åbningstider og CVR-nummer. Disse er bevidst **ikke** skrevet på sitet, fordi de ikke er kendt.
- Formuleringer der lover noget: "Kig forbi efter aftale, få en kop kaffe", "Kurt foretrækker et mindre og nøje udvalgt lager", "han holder øje med markedet og kontakter dig", "du får et konkret bud", "Når du kontakter Kurt, er det Kurt, der tager telefonen".
- "Vi" eller "Kurt": noget af teksten bruger "vi".
- Mottoet "Vi handler eksklusivt" (Om Kurt) stammer fra det gamle logo og kan læses tvetydigt, nu hvor "Eksklusive biler" er navnet på det ene univers. Behold eller fjern?
- Boxster 2.7 "1999": 2,7-motoren kom til modelår 2000. Årgang/modelår skal bekræftes.
- Introen på `/eksklusive-biler/` nævner 911 Turbo og Panamera Turbo ved navn. Den skal rettes, hvis de bliver solgt (`src/pages/eksklusive-biler.astro`).
- Privatlivspolitikken (`src/pages/privatlivspolitik.astro`).
- Rigtigt portræt af Kurt og showroom-billeder til Om Kurt. Der bruges ikke AI-billeder af personer.

## Struktur

```
site/
  astro.config.mjs        site-URL, sitemap, billed-domæner (cdn.sanity.io)
  scripts/
    seed-cars.mjs         research/cars.json → src/content/cars/*.json
    sync-images.mjs       assets/studio/<slug>/godkendt → src/assets/cars/<slug>
    image-order.json      (valgfri) tving bestemte billeder forrest
    export-sanity-ndjson.mjs  lokale biler → studio/seed/cars.ndjson
  src/
    content.config.ts     skema for bil-collection'en
    content/cars/         én JSON pr. bil
    assets/brand|cars/    logo, hero og optimerede bilbilleder
    lib/                  cars.ts (datalag: Sanity eller lokal), schema.ts (JSON-LD), site.ts, markdown.ts
    components/           Header, Footer, HeroShield, CarCard, CarImage, CarGallery, StockGrid, Portals, Form, Field …
    layouts/BaseLayout.astro
    pages/                alle sider
    scripts/              site.ts (reveal, magnetisk, tickers), hero.ts, car.ts, filters.ts, forms.ts, about.ts (GSAP)
    styles/global.css     design-tokens + to universer
  studio/                 Sanity Studio (selvstændig pakke)
```

**Låste regler:** Brug kun det nye sort/guld-logo; det gamle hvide logo må aldrig bruges. Brug kun godkendte studiebilleder. Nævn ikke finansiering, import eller eksport.
