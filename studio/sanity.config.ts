import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';

export default defineConfig({
  name: 'default',
  title: 'Kurt Christensen – biler',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'SAET-PROJECT-ID',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Indhold')
          .items([
            S.listItem().title('Biler til salg').child(S.documentList().title('Til salg').filter('_type == "car" && status != "solgt"')),
            S.listItem().title('Klassiske biler').child(S.documentList().title('Klassisk').filter('_type == "car" && univers == "klassisk"')),
            S.listItem().title('Eksklusive biler').child(S.documentList().title('Eksklusiv').filter('_type == "car" && univers == "eksklusiv"')),
            S.listItem().title('Solgte biler').child(S.documentList().title('Solgt').filter('_type == "car" && status == "solgt"')),
            S.divider(),
            S.listItem().title('Alle biler').child(S.documentTypeList('car').title('Alle biler')),
          ]),
    }),
    visionTool(),
  ],
  schema: { types: schemaTypes },
});
