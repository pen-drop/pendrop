# Testing MCP Commands Directly

Here are various methods to call MCP tools directly without AI:

## Method 1: CLI Test Tool (Easiest Method)

```bash
# List all available tools
npm run cli-test

# List projects
npm run cli-test list_projects

# Get files from a project
npm run cli-test get_project_files --project_id "91e5a65b-f964-8156-8007-1c13c6cb7a41"

# Search objects
npm run cli-test search_object --file_id "91e5a65b-f964-8156-8007-1bb9d270d414" --query "card"

# Get object tree
npm run cli-test get_object_tree \
  --file_id "91e5a65b-f964-8156-8007-1bb9d270d414" \
  --object_id "4c8ad837-966c-808d-8007-1bf8619939c2" \
  --fields '["id","name","type","x","y","width","height"]' \
  --depth -1
```

## Method 2: MCP Inspector (Graphical UI)

```bash
# Start inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

Opens a web UI for interactive testing!

## Method 3: Direct curl calls (HTTP Server only)

When the HTTP server is enabled:

```bash
# Get projects
curl http://localhost:5000/api/projects

# Get images
curl http://localhost:5000/images/IMAGE_ID.png
```

## Method 4: Node.js Test Script

Create your own test script:

```typescript
// test.ts
import { PenpotAPI } from './src/api/penpotApi';

async function test() {
  const api = new PenpotAPI();
  
  // List projects
  const projects = await api.listProjects();
  console.log('Projects:', projects);
  
  // Get files
  const files = await api.getProjectFiles('PROJECT_ID');
  console.log('Files:', files);
}

test();
```

Then run:
```bash
npx tsx test.ts
```

## Examples

### Example 1: List all projects
```bash
npm run cli-test list_projects
```

### Example 2: Search for cards
```bash
npm run cli-test search_object \
  --file_id "91e5a65b-f964-8156-8007-1bb9d270d414" \
  --query "card"
```

### Example 3: Get card details
```bash
npm run cli-test get_object_tree \
  --file_id "91e5a65b-f964-8156-8007-1bb9d270d414" \
  --object_id "4c8ad837-966c-808d-8007-1bf8619939c2" \
  --fields '["id","name","type","x","y","width","height","fills"]' \
  --depth 2
```

### Example 4: Export object
```bash
npm run cli-test export_object \
  --file_id "91e5a65b-f964-8156-8007-1bb9d270d414" \
  --page_id "91e5a65b-f964-8156-8007-1bb9d270d415" \
  --object_id "4c8ad837-966c-808d-8007-1bf8619939c2" \
  --export_type "png" \
  --scale 2
```

## Available Tools

1. **list_projects** - List all Penpot projects
2. **get_project_files** - Get files from a project (requires: project_id)
3. **get_file** - Get file data (requires: file_id)
4. **search_object** - Search objects (requires: file_id, query)
5. **get_object_tree** - Get object tree (requires: file_id, object_id, fields)
6. **export_object** - Export object (requires: file_id, page_id, object_id)

## Tips

- Pass arrays as JSON string: `--fields '["id","name"]'`
- Numbers as numbers: `--depth -1` or `--scale 2`
- Strings as strings: `--query "card"`
- Check full output for errors
- Enable debug mode in .env: `DEBUG=true`

