# Quick Start: AI-Orchestrated Design System Transformation

## Overview

Pendrop transforms design files (Penpot, Figma) into production-ready code using AI orchestration. Instead of hardcoded transformations, MCPs return instructions that guide the AI through the workflow.

## Prerequisites

- Node.js 18+
- Design file access (Penpot or Figma)
- Drupal 11 project (or other supported platform)

## Setup

### 1. Configure Your Project

Create `pendrop.yml` in your project root:

```yaml
project:
  type: drupal
  name: my-project
  theme: my_theme

design:
  url: https://design.penpot.app/#/view/project/file
  auth:
    penpot:
      username: your@email.com
      password: your-password

rules:
  transformations:
    penpot: pendrop-penpot  # Use built-in package
```

### 2. Install Pendrop MCPs

```bash
# Install penpot-mcp (extraction)
cd servers/penpot-mcp
npm install
npm run build

# Install theme-mcp (orchestration)
cd ../theme-mcp
npm install
npm run build
```

### 3. Configure MCP in Your AI Tool

Add to your MCP configuration (e.g., Claude Desktop config):

```json
{
  "mcpServers": {
    "penpot-mcp": {
      "command": "node",
      "args": ["/path/to/pendrop/servers/penpot-mcp/dist/index.js"]
    },
    "theme-mcp": {
      "command": "node",
      "args": ["/path/to/pendrop/servers/theme-mcp/dist/index.js"]
    }
  }
}
```

## Usage

### Transform Design System

Ask your AI:

```
Transform my Penpot design system located at:
https://design.penpot.app/#/view/project-id/file-id

Project path: /path/to/my-drupal-project
```

The AI will:
1. Call `theme-mcp.transform_design_system()` to get instructions
2. Call `penpot-mcp.extract_file()` to get raw design data
3. Transform the data using AI + transformation rules
4. Validate with `theme-mcp.validate_design_data()`
5. Save with `theme-mcp.save_design_data()`

Result: `.pendrop/dist/pendrop.data.ds.json` created with tokens, components, and stories.

### Generate Components (Future)

```
Generate Drupal SDC components from the design system data
for the "button" component
```

### Generate Stories (Future)

```
Generate Storybook story for the "button" component
using storybook-addon-sdc
```

## Customization

### Custom Transformation Package

Create your own transformation rules:

1. **Create Package Structure**:
```
my-project/design/my-penpot-rules/
├── prompts.yaml
└── examples/
    ├── input.json
    └── output.json
```

2. **Write Custom Instructions** (`prompts.yaml`):
```yaml
version: "1.0"
source: penpot

instructions: |
  Your custom transformation instructions...

tokens_instructions: |
  Extract tokens like this...

components_instructions: |
  Extract components like this...

naming:
  tokens: "kebab-case"
  components: "PascalCase"
  props: "camelCase"
```

3. **Configure in `pendrop.yml`**:
```yaml
rules:
  transformations:
    penpot: ./design/my-penpot-rules
```

### Override Target Conventions

Create `design/rules/conventions.yaml`:

```yaml
version: "1.0"
target: drupal

naming:
  style: snake_case
  component_prefix: "myprefix_"

paths:
  components: "custom/path/to/components"
```

Reference in `pendrop.yml`:

```yaml
rules:
  custom_rules_path: ./design/rules
```

## Workflow Details

### What Happens During Transformation?

```
┌─────────────────────────────────────────────────────┐
│ 1. AI asks theme-mcp for instructions              │
│    theme-mcp.transform_design_system(url, tool, path) │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. theme-mcp returns comprehensive instructions:    │
│    - Transformation rules from prompts.yaml         │
│    - Examples from examples/                        │
│    - Target schema (pendrop.schema.ds.json)        │
│    - Authentication config                          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. AI calls penpot-mcp to extract raw data         │
│    penpot-mcp.extract_file(url, auth)              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. AI transforms data using rules + intelligence   │
│    - Extracts W3C DTCG tokens                      │
│    - Identifies components                          │
│    - Generates story variants                       │
│    - Applies naming conventions                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 5. AI validates transformed data                    │
│    theme-mcp.validate_design_data(data, "ds")      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 6. If valid, AI saves to project                   │
│    theme-mcp.save_design_data(data, project_path)  │
│    → Saved to .pendrop/dist/pendrop.data.ds.json   │
└─────────────────────────────────────────────────────┘
```

### Output Structure

`.pendrop/dist/pendrop.data.ds.json`:

```json
{
  "$schema": "../../schemas/pendrop.schema.ds.json",
  "tokens": {
    "color": {
      "primary": {
        "$value": "#007bff",
        "$type": "color",
        "$description": "Primary brand color"
      }
    },
    "spacing": {
      "md": { "$value": "16px", "$type": "dimension" }
    }
  },
  "components": {
    "button": {
      "name": "Button",
      "description": "Primary action button",
      "category": "Atoms",
      "props": {
        "label": { "type": "string", "required": true },
        "variant": { "type": "enum", "enum": ["primary", "secondary"] }
      },
      "tokens": ["color.primary", "spacing.md"]
    }
  },
  "stories": {
    "button": {
      "componentId": "button",
      "variants": [
        { "name": "Default", "props": { "label": "Click me" } },
        { "name": "Primary", "props": { "variant": "primary" } }
      ]
    }
  }
}
```

## Troubleshooting

### Validation Errors

If validation fails, the AI will receive detailed errors:

```
✗ Validation failed. Fix these errors:
  - /tokens/color/primary: must have required property '$value'
  - /components/button/props: must be object
```

The AI will automatically fix the transformation and retry.

### Authentication Issues

Ensure credentials in `pendrop.yml` are correct:

```yaml
design:
  auth:
    penpot:
      username: correct@email.com
      password: correct-password
```

### Missing Transformation Package

Error: `Failed to load transformation rules from ...`

Solution: Check `pendrop.yml` → `rules.transformations.{tool}` points to valid path.

## Examples

See `examples/drupal-demo/` for a complete working example:
- Drupal 11 project structure
- Configured `pendrop.yml`
- Design data examples
- Storybook setup

## Next Steps

1. **Explore transformation packages**: `rules/transformations/`
2. **Read architecture docs**: `docs/ARCHITECTURE.md`
3. **Customize for your project**: Create custom transformation package
4. **Generate components**: Ask AI to generate Drupal SDC components
5. **Build Storybook**: Generate stories for your components

## Resources

- **Architecture Overview**: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- **Implementation Details**: [docs/IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Theme MCP Tools**: [servers/theme-mcp/README.md](../servers/theme-mcp/README.md)
- **Example Project**: [examples/drupal-demo/README.md](../examples/drupal-demo/README.md)

## Support

For issues or questions:
- Check transformation package prompts: `rules/transformations/pendrop-{tool}/prompts.yaml`
- Review AI instructions returned by `transform_design_system`
- Examine validation errors for schema compliance
- Consult architecture documentation

Happy transforming! 🚀

