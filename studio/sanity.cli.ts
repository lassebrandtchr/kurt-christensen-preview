import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'SAET-PROJECT-ID',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Studiet hostes gratis på https://<navn>.sanity.studio efter `npm run deploy`
  studioHost: process.env.SANITY_STUDIO_HOSTNAME || 'kurt-christensen',
});
