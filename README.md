# Pendrop


Pendrop automates the creation of Drupal applications using AI-powered workflows that transform design system data and content structure definitions into production-ready code.

## Concept

Pendrop implements two AI-driven pipelines:

### 1. Design-System-Pipeline

```
Design Tool (Penpot/Figma) → Extract → pendrop.data.ds.json → Generate → Components + Stories
```

Transform visual designs into code:
- Extract design tokens and components from design tools
- Generate Drupal Single Directory Components (SDC)
- Create Storybook stories for component documentation
- Maintain design-system consistency

### 2. Content-/CMS-Pipeline

```
pendrop.data.content.json → Generate → Drupal Config + Mappings
```

Transform content structure into CMS configuration:
- Define content types, fields, and relationships
- Generate Drupal configuration (content types, views, etc.)
- Create field mappings and migrations
- Build complete content architecture


### Components

Pendrop uses **Model Context Protocol (MCP)** servers for AI-powered orchestration:

- **penpot-mcp**: Extract design data from Penpot
- **figma-mcp** (future): Extract design data from Figma
- **theme-mcp**: AI orchestrator for design system transformations (returns instructions/prompts)
- **schema-mcp**: Content structure and CMS configuration generation

### Key Principles

1. **AI Orchestration**: MCPs return prompts/instructions, not results. AI executes the workflow.
2. **Data as Rules**: `pendrop.data.ds.json` and `pendrop.data.content.json` define generation rules
3. **Configurable Transformations**: Transformation packages (rules + prompts) are customizable
4. **Convention-Based**: Minimal conventions per target platform, easily extensible
5. **Tool-Agnostic**: Works with any design tool that provides extraction MCP


## Project Structure

```
pendrop/
├── schemas/                    # JSON schemas
│   ├── pendrop.schema.content.json
│   ├── pendrop.design-system.json
│   └── pendrop.rules.json
├── rules/                      # Generation conventions
│   └── targets/
│       └── drupal/
├── servers/                    # MCP servers
│   ├── penpot-mcp/            # Penpot extraction
│   ├── theme-mcp/             # Design system bridge + generation
│   └── schema-mcp/            # Content structure generation
├── plugins/                    # Design tool plugins
│   └── penpot/
├── examples/                   # Example projects
│   ├── basic/
│   └── drupal-demo/            # Full Drupal 11 project
└── docs/                       # Documentation
    └── ADR/                    # Architecture Decision Records
```

## Getting Started

See [examples/drupal-demo/README.md](examples/drupal-demo/README.md) for a complete Drupal 11 example project.

## Documentation

- **Architecture Decision Records**: [docs/ADR/](docs/ADR/)
- **Rules System**: [rules/README.md](rules/README.md)
- **MCP Servers**:
  - [servers/penpot-mcp/README.md](servers/penpot-mcp/README.md)
  - [servers/theme-mcp/README.md](servers/theme-mcp/README.md)
  - [servers/schema-mcp/README.md](servers/schema-mcp/README.md)

## License
MIT
