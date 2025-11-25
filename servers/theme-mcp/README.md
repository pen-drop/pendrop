# Theme MCP Server

AI orchestrator MCP server for design system transformations. Returns instructions/prompts for AI to execute, coordinating between extraction MCPs and generation tasks.

## Overview

Theme MCP acts as an **AI orchestrator** that provides instructions for transforming design files into code. Instead of directly transforming data, it returns detailed prompts that guide the AI through the complete workflow.

## Core Paradigm

**MCPs return PROMPTS/INSTRUCTIONS, not results.**

The AI reads instructions and orchestrates the workflow by calling multiple MCPs based on those instructions.

## Architecture

```
User/AI
  ↓
theme-mcp.transform_design_system(url, source_tool, project_path)
  ↓
Returns INSTRUCTIONS:
  "1. Call penpot-mcp.extract_file(url)
   2. Transform data using these rules: [rules]
   3. Validate with theme-mcp.validate_design_data()
   4. Save with theme-mcp.save_design_data()"
  ↓
AI executes instructions:
  → Calls penpot-mcp
  → Transforms data using AI + rules
  → Validates with theme-mcp
  → Saves with theme-mcp
```

## Tools

### `transform_design_system(design_url, source_tool, project_path)`

Returns comprehensive instructions for transforming a design file to Pendrop format.

**Parameters:**
- `design_url` (string): URL to design file (Penpot, Figma, etc.)
- `source_tool` (string): Source design tool (`penpot`, `figma`)
- `project_path` (string): Path to project root (where pendrop.yml is located)

**Returns:**
```json
{
  "success": true,
  "instructions": "# Design System Transformation Instructions...",
  "mcp_calls": [
    { "mcp": "penpot-mcp", "tool": "extract_file", "params": {...} },
    { "mcp": "theme-mcp", "tool": "validate_design_data", "params": {...} },
    { "mcp": "theme-mcp", "tool": "save_design_data", "params": {...} }
  ],
  "rules": { /* transformation rules */ },
  "examples": "/* example transformations */"
}
```

**Example:**
```javascript
{
  "design_url": "https://design.penpot.app/#/view/project-id/file-id",
  "source_tool": "penpot",
  "project_path": "/path/to/drupal-demo"
}
```

### `validate_design_data(data, schema_type)`

Validates transformed design data against Pendrop schemas.

**Parameters:**
- `data` (object): The transformed design data
- `schema_type` (string): `"ds"` for design system or `"content"` for content structure

**Returns:**
```json
{
  "success": true,
  "valid": true,
  "message": "✓ Data is valid pendrop.theme.json"
}
```

Or if invalid:
```json
{
  "success": true,
  "valid": false,
  "errors": [
    { "path": "/tokens", "message": "must be object" }
  ],
  "message": "✗ Validation failed..."
}
```

### `save_design_data(data, project_path)`

Saves validated design data to project (`.pendrop/dist/pendrop.data.ds.json`).

**Parameters:**
- `data` (object): The validated design data
- `project_path` (string): Path to project root

**Returns:**
```json
{
  "success": true,
  "path": "/path/to/project/.pendrop/dist/pendrop.data.ds.json",
  "message": "✓ Design system data saved"
}
```

### Legacy Tools

These tools are maintained for backwards compatibility but not part of the main orchestration flow:

- `extract_design(fileUrl, options)` - Direct extraction (placeholder)
- `generate_component(...)` - Component generation (to be updated)
- `generate_story(...)` - Story generation (to be updated)

## Transformation Packages

Transformation rules are organized into **packages** that define how to transform a specific design tool's data to Pendrop format.

### Package Structure

```
rules/transformations/
├── pendrop-penpot/          # Built-in Penpot→Pendrop
│   ├── prompts.yaml         # Transformation instructions for AI
│   └── examples/            # Example input/output pairs
│       ├── simple-input.json
│       └── simple-output.json
└── pendrop-figma/           # Built-in Figma→Pendrop
    ├── prompts.yaml
    └── examples/
```

### Custom Transformation Packages

Projects can override transformation rules by configuring custom packages in `pendrop.yml`:

```yaml
rules:
  transformations:
    penpot: pendrop-penpot              # Use built-in (default)
    # OR
    penpot: ./design/my-penpot-rules    # Use local package
    # OR (future)
    penpot: @company/penpot-transform   # Use npm package
```

A custom package must have the same structure:
- `prompts.yaml` - Transformation instructions
- `examples/` - Optional example transformations

## Configuration

Projects configure Pendrop via `pendrop.yml` in the project root:

```yaml
project:
  type: drupal
  name: my-project
  theme: my_theme

design:
  url: https://design.penpot.app/#/view/...
  auth:
    penpot:
      username: user@example.com
      password: secret

rules:
  custom_rules_path: ./design/rules
  transformations:
    penpot: pendrop-penpot  # or custom path
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

## AI Workflow Example

```
USER: Transform my Penpot design system

AI: I'll help you with that.
    [Calls theme-mcp.transform_design_system(...)]

THEME-MCP: Returns detailed instructions:
  "1. Call penpot-mcp.extract_file(url, auth)
   2. Transform using these rules: [W3C DTCG tokens, component props, etc.]
   3. Validate with theme-mcp.validate_design_data(data)
   4. Save with theme-mcp.save_design_data(data, path)"

AI: Following the instructions...
    [Calls penpot-mcp.extract_file(...)]

PENPOT-MCP: Returns raw Penpot JSON

AI: Transforming data using rules...
    [AI applies transformation rules to convert raw data to pendrop.data.ds.json]

AI: Validating...
    [Calls theme-mcp.validate_design_data(transformed_data)]

THEME-MCP: ✓ Data is valid

AI: Saving...
    [Calls theme-mcp.save_design_data(validated_data, project_path)]

THEME-MCP: ✓ Saved to .pendrop/dist/pendrop.data.ds.json

AI → USER: ✓ Design system transformed and saved!
```

## Benefits of AI Orchestration

1. **Flexible**: Easy to modify workflow by changing prompts
2. **Transparent**: AI can explain what it's doing
3. **Intelligent**: AI understands context and makes decisions
4. **Error Recovery**: AI can retry and fix errors
5. **Extensible**: Works with any extraction MCP
6. **Customizable**: Rules are prompts, easy to customize
7. **No Complex IPC**: No MCP-to-MCP communication code needed

## Extending

### Adding a New Design Tool

1. Create transformation package in `rules/transformations/pendrop-{tool}/`
2. Write `prompts.yaml` with transformation instructions
3. Add examples (optional)
4. Configure in project's `pendrop.yml`

### Adding a New Target Platform

1. Create conventions in `rules/targets/{platform}/`
2. Define naming, paths, and structure conventions
3. Configure in project's `pendrop.yml`

