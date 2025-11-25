# Pendrop

AI-powered design-to-code automation. Transform designs from Penpot or Figma into production-ready components for any framework or CMS.

## Concept

Pendrop uses AI to orchestrate two pipelines:

### 1. Design System Pipeline

```
Design Tool → theme-mcp (bridge) → extraction MCP → Transform (AI) → Generate → Target Components
```

**Flow:**
1. `theme-mcp` detects design tool (Penpot/Figma/etc.) from URL
2. Routes to appropriate extraction MCP (`penpot-mcp`, `figma-mcp`, ...)
3. AI transforms raw data to `pendrop.theme.json` using transformation rules
4. AI generates components based on target (Drupal SDC, Vue, React, Svelte, ...)

**Target Examples:**
- Drupal: Single Directory Components (SDC) + Storybook
- Vue: SFC components + Storybook
- React: Components + Storybook
- Any framework with appropriate generation rules

### 2. Content/Structure Pipeline

```
pendrop.content.json → schema-mcp → Generate (AI) → Target Configuration
```

Transform content structure definitions into CMS/framework-specific configuration.

**Target Examples:**
- Drupal: Content types, fields, views, migrations
- Strapi: Collections, content types, API configuration
- Custom: GraphQL schemas, API endpoints
- Any system with appropriate generation rules

## Architecture

### MCP Servers

**theme-mcp** - Design System Bridge
- Detects design tool from URL patterns
- Routes to extraction MCPs (Penpot, Figma)
- Returns AI prompts for transformation and generation
- Tool-agnostic orchestration layer

**penpot-mcp / figma-mcp** - Extraction
- Extract raw design data from design tools
- Handle tool-specific authentication
- Return structured design data

**schema-mcp** - Content Structure
- Generate CMS/framework configuration from content schemas
- Create field mappings and content types
- Target-agnostic (Drupal, Strapi, custom, ...)

### Key Principles

1. **AI as Orchestrator**: MCPs return prompts, AI executes the workflow
2. **Bridge Pattern**: `theme-mcp` routes to tool-specific extraction MCPs
3. **Extraction Packages**: Configurable rules define how to extract and transform source data (e.g., `pendrop-penpot`, `pendrop-figma`)
4. **Target-Agnostic**: Generate for any framework/CMS with target-specific rules in `rules/targets/`
5. **Convention over Configuration**: Minimal, extensible conventions per target
6. **Project Control**: Override everything via `pendrop.yml` in your project


## Project Structure

```
pendrop/
├── schemas/                    # JSON schemas for validation
│   ├── pendrop.theme.json     # Design system data schema
│   ├── pendrop.content.json   # Content structure schema
│   ├── pendrop.config.json    # pendrop.yml schema
│   ├── pendrop.transform.json # Transformation package schema
│   └── pendrop.rules.json     # Rules validation schema
├── rules/
│   └── theme/
│       ├── targets/           # Target conventions (drupal, vue, react, strapi, ...)
│       └── extraction/        # Source extraction packages (penpot→pendrop, figma→pendrop)
├── servers/                    # MCP servers
│   ├── theme-mcp/             # Design system bridge & orchestrator
│   ├── penpot-mcp/            # Penpot data extraction
│   └── schema-mcp/            # Content/CMS generation
├── plugins/penpot/            # Penpot plugin for data export
├── examples/
│   ├── basic/                 # Basic data examples
│   └── drupal-demo/           # Full Drupal 11 project with pendrop.yml
└── docs/
    ├── ADR/                   # Architecture Decision Records
    └── MCP_INTEGRATION.md     # Integration guide
```

## Quick Start

1. **Create `pendrop.yml` in your project:**

```yaml
project:
  type: drupal        # Target: drupal, vue, react, strapi, ...
  theme: my_theme     # or component_library, depending on target

design:
  urls:
    - https://design.penpot.app/#/view/project/file
    - https://www.figma.com/file/xyz/MyDesign
```

2. **Use MCP in Cursor/Claude:**

```
Extract design from [URL] and generate components
```

The AI will:
- Call `theme-mcp` to route to the correct extraction MCP
- Transform data using extraction rules for the source tool
- Generate components based on your target (Drupal SDC, Vue, React, ...)

**Examples:**
- [examples/drupal-demo/](examples/drupal-demo/) - Drupal 11 with SDC
- More targets coming: Vue, React, Strapi

## Documentation

- **[MCP Integration Guide](docs/MCP_INTEGRATION.md)** - Setup and usage
- **[Theme MCP README](servers/theme-mcp/README.md)** - Bridge architecture
- **[Rules System](rules/README.md)** - Conventions and extraction packages
- **[ADRs](docs/ADR/)** - Architecture decisions

## License
MIT
