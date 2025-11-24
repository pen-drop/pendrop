# Schema MCP Server

MCP server for content structure and CMS configuration generation. Reads `pendrop.data.content.json` and generates platform-specific content types, fields, and configurations.

## Overview

Schema MCP handles the **content/CMS pipeline** in the Pendrop AI workflow. It transforms content structure definitions into CMS-specific configurations.

## Architecture

```
pendrop.data.content.json → schema-mcp → Generated CMS Config
                                ↓
                         Load Conventions
                                ↓
                    Generate Content Types + Views + Config
```

## Features

### Content Type Generation
- Create CMS content type definitions from `pendrop.data.content.json`
- Generate field storage and field instance configurations
- Create form and view display configurations
- Platform-specific (e.g., Drupal)

### Configuration Generation
- Generate Views and other CMS configurations
- Create migration templates
- Generate field mappings

### Validation
- Validate content structure against `pendrop.schema.content.json`
- Ensure data consistency

### Convention-Based
- Uses target conventions for naming and structure
- Supports project-specific overrides

## Tools

### `generate_content_types(pendropContentData, target, conventions)`
Generate CMS content type definitions.

**Parameters:**
- `pendropContentData` (object): Content structure from pendrop.data.content.json
- `target` (string): Target platform (e.g., "drupal")
- `conventions` (object, optional): Convention overrides

**Returns:** Generated content type configuration files

**Example:**
```javascript
{
  "pendropContentData": {
    "content": {
      "node": {
        "article": {
          "fields": { ... }
        }
      }
    }
  },
  "target": "drupal"
}
```

### `generate_config(pendropContentData, target, conventions)`
Generate CMS configuration (views, etc.).

**Parameters:**
- `pendropContentData` (object): Content structure
- `target` (string): Target platform
- `conventions` (object, optional): Convention overrides

**Returns:** Generated configuration files

### `validate_structure(data, schemaType)`
Validate data against pendrop schemas.

**Parameters:**
- `data` (object): Data to validate
- `schemaType` (string): Schema type ("content" or "ds")

**Returns:** Validation result

## Configuration

Create `schema-mcp.config.json`:

```json
{
  "target": "drupal",
  "rulesPath": "../../rules",
  "projectRules": null,
  "schemasPath": "../../schemas"
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

Schema MCP is designed for AI-powered content structure generation:

1. **AI defines content structure**: Creates or loads `pendrop.data.content.json`
2. **AI validates structure**: Calls `validate_structure()` against schema
3. **AI generates CMS config**: Calls `generate_content_types()` and `generate_config()`
4. **AI applies conventions**: Uses loaded conventions with optional overrides

## Drupal Example

```javascript
// Generate article content type
{
  "pendropContentData": {
    "content": {
      "node": {
        "article": {
          "label": "Article",
          "fields": {
            "title": { "type": "string" },
            "body": { "type": "text_long" },
            "image": { "type": "image" }
          }
        }
      }
    }
  },
  "target": "drupal"
}

// Output:
// - config/sync/node.type.article.yml
// - config/sync/field.storage.node.*.yml
// - config/sync/field.field.node.article.*.yml
// - config/sync/core.entity_form_display.node.article.default.yml
// - config/sync/core.entity_view_display.node.article.default.yml
```

## Extending with New Targets

To add support for a new CMS platform:

1. Create conventions in `rules/targets/{platform}/`
2. Add platform-specific templates if needed
3. Configure in `schema-mcp.config.json`

