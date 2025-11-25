# AI-Based Workflow Architecture Implementation

## Summary

Implement tool-agnostic MCP server architecture for AI-powered design system extraction and code generation. This establishes the foundation for Pendrop's two main pipelines: **Design-System-Pipeline** and **Content-/CMS-Pipeline**.

## Motivation

Pendrop needs a flexible, AI-driven workflow that:
- Supports multiple design tools (Penpot, Figma) without code duplication
- Generates code for multiple target platforms (Drupal, WordPress, etc.)
- Uses convention-based configuration instead of hardcoded logic
- Leverages AI for intelligent code generation with minimal human intervention

## Architecture Overview

### Two Pipelines

#### 1. Design-System-Pipeline
```
Design Tool (Penpot/Figma) → Extraction → pendrop.data.ds.json → Generation → Components + Stories
```

**Goal**: Transform visual designs into production code

**Components**:
- **Extraction MCPs** (penpot-mcp, figma-mcp): Tool-specific extraction
- **theme-mcp**: Bridge/orchestrator + code generator
- **pendrop.data.ds.json**: Design system data (THE rules)

**Output**:
- Drupal Single Directory Components (SDC)
- Storybook stories using storybook-addon-sdc
- Design tokens in W3C DTCG format

#### 2. Content-/CMS-Pipeline
```
pendrop.data.content.json → Generation → Drupal Config + Mappings
```

**Goal**: Transform content structure definitions into CMS configuration

**Components**:
- **schema-mcp**: Content structure generator
- **pendrop.data.content.json**: Content structure (THE rules)

**Output**:
- Drupal content type configurations
- Field configurations
- Views and other CMS configuration

### Key Design Principles

1. **Data as Rules**: `pendrop.data.ds.json` and `pendrop.data.content.json` ARE the rules for generation
2. **Tool-Agnostic MCPs**: Servers are generic; conventions define platform-specific behavior
3. **Convention-Based**: Minimal, layered conventions (built-in → target → project)
4. **Bridge Pattern**: theme-mcp routes to tool-specific extraction MCPs based on URL
5. **AI-Powered**: Code generation uses AI with prompts and conventions

## Implementation

### MCP Servers

#### penpot-mcp (Updated)
- Already exists, updated to clarify it outputs `pendrop.data.ds.json`
- Tool-specific extraction for Penpot
- Transforms Penpot data to pendrop schema format

#### theme-mcp (New)
- **Bridge**: Routes extraction requests to penpot-mcp/figma-mcp based on URL
- **Generator**: Provides `generate_component()` and `generate_story()` tools
- Loads conventions and AI prompts
- Single entry point for design system operations

#### schema-mcp (New)
- **Generator**: Provides `generate_content_types()`, `generate_config()`, `validate_structure()` tools
- Reads `pendrop.data.content.json`
- Generates Drupal configuration files
- Uses conventions for naming and structure

### Convention System

#### Structure
```
rules/
└── targets/
    └── drupal/
        ├── conventions.yaml  # Naming, paths, structure
        ├── prompts.yaml      # AI generation prompts
        └── story.yaml        # Story configuration
```

#### Layer Merging
```
Built-in → Target (drupal) → Project Custom → Final Conventions
```

Projects can override any convention without code changes.

#### Example: Drupal Conventions
```yaml
naming:
  style: snake_case
paths:
  components: /components
structure:
  component_files: [component.yml, template.twig]
drupal:
  component_namespace: custom
```

### Story Concept

"Story" is a generic component presentation concept (not Storybook-specific):
- For Drupal: Storybook with `storybook-addon-sdc`
- For other platforms: Can be different formats
- Configured via `story.yaml` per target

### Data Files

#### pendrop.data.ds.json
```json
{
  "$schema": "../../schemas/pendrop.schema.ds.json",
  "tokens": { /* W3C DTCG format */ },
  "components": { /* Component definitions */ },
  "stories": { /* Story/variant definitions */ }
}
```

#### pendrop.data.content.json
```json
{
  "$schema": "../../schemas/pendrop.schema.content.json",
  "content": { /* Content types, fields */ },
  "config": { /* Views, etc. */ }
}
```

### Schemas

- `pendrop.schema.content.json`: Existing, defines content structure
- `pendrop.schema.ds.json`: Existing, defines design system with W3C DTCG tokens
- `pendrop.rules.json`: New, validates convention files

## Workflow Example

### Design-System-Pipeline Workflow

1. **AI receives** design file URL: `https://design.penpot.app/#/view/project/file`

2. **AI calls** theme-mcp:
   ```javascript
   extract_design({ fileUrl: "https://design.penpot.app/..." })
   ```

3. **theme-mcp routes** to penpot-mcp (auto-detected from URL)

4. **penpot-mcp** extracts and returns `pendrop.data.ds.json`

5. **AI analyzes** design system data

6. **AI generates components**:
   ```javascript
   generate_component({
     pendropDsData: { /* data */ },
     componentId: "button",
     target: "drupal"
   })
   ```

7. **AI generates stories**:
   ```javascript
   generate_story({
     pendropDsData: { /* data */ },
     componentId: "button",
     target: "drupal"
   })
   ```

8. **Output**:
   - `/components/button/component.yml`
   - `/components/button/template.twig`
   - `/stories/button.stories.js`

### Content-/CMS-Pipeline Workflow

1. **AI creates/loads** `pendrop.data.content.json`

2. **AI validates**:
   ```javascript
   validate_structure({ data: contentData, schemaType: "content" })
   ```

3. **AI generates content types**:
   ```javascript
   generate_content_types({
     pendropContentData: contentData,
     target: "drupal"
   })
   ```

4. **AI generates config**:
   ```javascript
   generate_config({
     pendropContentData: contentData,
     target: "drupal"
   })
   ```

5. **Output**:
   - `/config/sync/node.type.article.yml`
   - `/config/sync/field.storage.node.*.yml`
   - `/config/sync/views.view.*.yml`

## Project Structure

```
pendrop/
├── rules/                      # NEW: Convention system
│   ├── targets/drupal/
│   │   ├── conventions.yaml
│   │   ├── prompts.yaml
│   │   └── story.yaml
│   └── README.md
├── schemas/                    # UPDATED
│   ├── pendrop.schema.content.json
│   ├── pendrop.schema.ds.json
│   └── pendrop.rules.json      # NEW
├── servers/
│   ├── penpot-mcp/            # UPDATED: Clarify output format
│   ├── theme-mcp/             # NEW: Bridge + generator
│   └── schema-mcp/            # NEW: Content structure generator
├── examples/
│   └── ai-workflow/           # NEW: Complete workflow example
└── docs/
    ├── ADR/                   # NEW: Architecture Decision Records
    │   ├── 001-theme-mcp-bridge-pattern.md
    │   ├── 002-extraction-outputs-pendrop-format.md
    │   ├── 003-generic-story-concept.md
    │   └── 004-convention-layering.md
    ├── ARCHITECTURE.md        # NEW: Architecture overview
    └── GITHUB_ISSUE.md        # This file
```

## Benefits

1. **Extensibility**: Easy to add new design tools and target platforms
2. **Flexibility**: Convention-based configuration without code changes
3. **AI-Friendly**: Single entry points with clear tool interfaces
4. **Separation of Concerns**: Extraction (tool-specific) vs. Generation (tool-agnostic)
5. **Reusability**: Extraction MCPs can be used independently
6. **Maintainability**: Clear architecture with documented decisions (ADRs)

## Initial Focus

- **Design Tools**: Penpot (now), Figma (later)
- **Target Platform**: Drupal 10+ with SDC
- **Story Format**: Storybook with storybook-addon-sdc

## Documentation

- **ADRs**: Explain key architectural decisions
- **Server READMEs**: Document each MCP server
- **Rules README**: Explain convention system and extensibility
- **Example Project**: Complete workflow demonstration
- **Architecture Doc**: Comprehensive architecture overview

## Future Extensions

1. **Additional Design Tools**: Sketch, Adobe XD, etc.
2. **Additional Targets**: WordPress, Laravel, etc.
3. **Additional Story Formats**: MDX docs, HTML demos, etc.
4. **Validation**: Runtime schema validation in MCPs
5. **CLI**: Command-line interface for manual workflow
6. **Testing**: Automated testing for generated code

## References

- [ADR 001: Theme MCP Bridge Pattern](../docs/ADR/001-theme-mcp-bridge-pattern.md)
- [ADR 002: Extraction Outputs Pendrop Format](../docs/ADR/002-extraction-outputs-pendrop-format.md)
- [ADR 003: Generic Story Concept](../docs/ADR/003-generic-story-concept.md)
- [ADR 004: Convention Layering](../docs/ADR/004-convention-layering.md)
- [Architecture Overview](../docs/ARCHITECTURE.md)
- [Workflow Example](../examples/ai-workflow/README.md)

## Implementation Status

This issue tracks the initial implementation. See PR #[NUMBER] for the complete implementation including:

- ✅ Convention system with Drupal conventions
- ✅ `pendrop.rules.json` schema
- ✅ Updated penpot-mcp README
- ✅ New theme-mcp server (bridge + generator)
- ✅ New schema-mcp server (content structure)
- ✅ Example ai-workflow project
- ✅ Architecture Decision Records (4 ADRs)
- ✅ Updated main documentation

---

**Note**: The MCP servers provide the **structure and interfaces** for AI-powered generation. Actual AI integration (calling Claude/GPT with prompts) happens at the AI agent level using these MCP tools.

