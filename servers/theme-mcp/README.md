# Theme MCP Server

Bridge/orchestrator MCP server for design system operations. Routes extraction requests to tool-specific MCPs (penpot-mcp, figma-mcp) and provides generation tools for components and stories.

## Overview

Theme MCP acts as a **single entry point** for all design system operations in the Pendrop AI workflow. It bridges extraction and generation phases.

## Architecture

```
Design File URL → theme-mcp (router) → penpot-mcp/figma-mcp → pendrop.data.ds.json
                                     ↓
                              Load Conventions
                                     ↓
                          Generate Components + Stories
```

## Features

### Bridge/Router
- **URL-based routing**: Automatically routes to the correct extraction MCP based on file URL
  - `penpot.com/*` → penpot-mcp
  - `figma.com/*` → figma-mcp (future)
  - Local files → Auto-detect format

### Code Generation
- **Component generation**: Create platform-specific components (e.g., Drupal SDC)
- **Story generation**: Generate component presentations (e.g., Storybook with storybook-addon-sdc)
- **Convention-based**: Uses target conventions for naming, structure, and output format

### Convention System
- Loads conventions from `rules/targets/{platform}/`
- Supports project-specific overrides
- Merges conventions: built-in → target → project

## Tools

### `extract_design(fileUrl, options)`
Routes to appropriate extraction MCP and returns `pendrop.data.ds.json`.

**Parameters:**
- `fileUrl` (string): URL or path to design file
- `options` (object, optional): Extraction options

**Returns:** Design system data in pendrop.schema.ds.json format

**Example:**
```javascript
{
  "fileUrl": "https://design.penpot.app/#/view/project-id/file-id",
  "options": {
    "includeHiddenLayers": false
  }
}
```

### `generate_component(pendropDsData, componentId, target, conventions)`
Generate component code for target platform.

**Parameters:**
- `pendropDsData` (object): Design system data from extract_design
- `componentId` (string): Component ID to generate
- `target` (string): Target platform (e.g., "drupal")
- `conventions` (object, optional): Convention overrides

**Returns:** Generated component files (component.yml, template.twig for Drupal SDC)

### `generate_story(pendropDsData, componentId, target, conventions)`
Generate component story/presentation.

**Parameters:**
- `pendropDsData` (object): Design system data
- `componentId` (string): Component ID
- `target` (string): Target platform (e.g., "drupal")
- `conventions` (object, optional): Convention overrides

**Returns:** Generated story file (e.g., .stories.js for Storybook)

## Configuration

Create `theme-mcp.config.json`:

```json
{
  "target": "drupal",
  "rulesPath": "../../rules",
  "projectRules": null,
  "extractors": {
    "penpot": {
      "serverUrl": "http://localhost:3000",
      "mcpPath": "../penpot-mcp"
    },
    "figma": {
      "serverUrl": "http://localhost:3001",
      "mcpPath": "../figma-mcp"
    }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development with watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
npm run lint:fix
```

## Integration with AI Workflow

Theme MCP is designed to be used in AI-powered workflows:

1. **AI extracts design**: Calls `extract_design(url)` with Penpot/Figma URL
2. **AI analyzes data**: Reviews `pendrop.data.ds.json` structure
3. **AI generates code**: Calls `generate_component()` and `generate_story()` for each component
4. **AI applies conventions**: Uses loaded conventions and can override per-component

## Extending with New Design Tools

To add support for a new design tool:

1. Create a new extraction MCP (e.g., `sketch-mcp`)
2. Ensure it outputs `pendrop.schema.ds.json` format
3. Update `theme-mcp.config.json` with new extractor
4. Add URL pattern matching in `src/utils/router.ts`

## Extending with New Targets

To add support for a new target platform:

1. Create conventions in `rules/targets/{platform}/`
2. Add templates if needed
3. Configure in `theme-mcp.config.json`

