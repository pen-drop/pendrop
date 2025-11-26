import { extractDesign } from './servers/theme-mcp/dist/tools/extract.js';

const result = await extractDesign({
  design_url: 'https://penpot.keytec.de/#/workspace?team-id=91e5a65b-f964-8156-8007-1bb9d03afead&file-id=91e5a65b-f964-8156-8007-1bb9d270d414&page-id=9a4a7d51-319a-805a-8007-1be4ba78f5fd',
  project_path: '/home/cw/projects/pendrop/examples/drupal-demo'
});

console.log(JSON.stringify(result, null, 2));
