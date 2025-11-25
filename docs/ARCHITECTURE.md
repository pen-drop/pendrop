# Pendrop Architecture

## Core Paradigm: AI Orchestration

Pendrop uses a unique architecture where **MCPs return prompts/instructions instead of results**. The AI reads these instructions and orchestrates the complete workflow.

### Why This Approach?

1. **Flexibility**: Easy to modify workflows by changing prompts
2. **Transparency**: AI can explain what it's doing
3. **Intelligence**: AI understands context and makes decisions
4. **Error Recovery**: AI can retry and fix errors
5. **Extensibility**: Works with any extraction MCP
6. **Customizability**: Rules are prompts, easy to customize
7. **No Complex IPC**: No MCP-to-MCP communication code needed
8. **Diverse Data Handling**: AI can transform any source data format

## Architecture Flow

```
User/AI
  ↓
1. Call theme-mcp.transform_design_system(url, source_tool, project_path)
  ↓
theme-mcp returns INSTRUCTIONS:
  "To transform this design system:
   1. Call penpot-mcp.extract_file(url) to get raw data
   2. Transform data using these rules: [rules]
   3. Use these examples: [examples]
   4. Validate with theme-mcp.validate_design_data()
   5. Save with theme-mcp.save_design_data()"
  ↓
2. AI executes instructions step-by-step:
  ↓
  Calls penpot-mcp.extract_file() → raw Penpot JSON
  ↓
  AI transforms data using rules from instructions
  ↓
  Calls theme-mcp.validate_design_data() → validation result
  ↓
  Calls theme-mcp.save_design_data() → saves to .pendrop/dist/
  ↓
3. AI reports completion to user
```

## Components

### 1. Extraction MCPs

**Purpose**: Extract raw design data from design tools

**Examples**:
- `penpot-mcp`: Extracts Penpot file data
- `figma-mcp`: Extracts Figma file data (future)

**Interface**:
```typescript
extract_file(file_url: string, auth: object) → raw_design_data
```

**Characteristics**:
- Tool-specific (one per design tool)
- Returns raw, unstructured data
- No transformation logic

### 2. Theme MCP (Orchestrator)

**Purpose**: Provide AI instructions for design system transformations

**Tools**:
- `transform_design_system()`: Returns transformation instructions
- `validate_design_data()`: Validates transformed data
- `save_design_data()`: Saves validated data to project

**Characteristics**:
- Tool-agnostic orchestrator
- Returns prompts, not results
- Loads transformation packages (rules + examples)
- Validates against schemas
- Saves to project structure

### 3. Schema MCP (Future)

**Purpose**: Generate CMS configuration from content structure

**Tools**:
- `generate_content_types()`: Returns instructions for content type generation
- `generate_config()`: Returns instructions for CMS configuration

### 4. Transformation Packages

**Purpose**: Define how to transform source data to Pendrop format

**Structure**:
```
rules/transformations/
└── pendrop-{tool}/
    ├── prompts.yaml          # AI instructions
    └── examples/             # Example transformations
        ├── simple-input.json
        └── simple-output.json
```

**Configuration** (`pendrop.yml`):
```yaml
rules:
  transformations:
    penpot: pendrop-penpot              # Built-in
    # OR
    penpot: ./design/my-penpot-rules    # Custom local
    # OR
    penpot: @company/penpot-transform   # NPM package (future)
```

**Benefits**:
- Fully customizable transformation logic
- Easy to create custom packages
- Shareable via npm (future)
- AI performs transformation (handles diverse data)

### 5. Target Conventions

**Purpose**: Define platform-specific conventions

**Structure**:
```
rules/targets/
└── drupal/
    ├── conventions.yaml      # Naming, paths, structure
    ├── prompts.yaml          # Generation prompts
    └── story.yaml            # Story format config
```

**Layering**:
1. Built-in conventions (shipped with Pendrop)
2. Target conventions (platform-specific)
3. Project overrides (in `pendrop.yml` or custom files)

### 6. Schemas

**Purpose**: Define data structures

**Files**:
- `pendrop.schema.ds.json`: Design system data (tokens, components, stories)
- `pendrop.schema.content.json`: Content structure (content types, fields)
- `pendrop.schema.config.json`: Project configuration (`pendrop.yml`)

## Data Flow: Design System Pipeline

```
1. USER: "Transform my Penpot design system"
   ↓
2. AI calls theme-mcp.transform_design_system({
     design_url: "https://design.penpot.app/#/...",
     source_tool: "penpot",
     project_path: "/path/to/project"
   })
   ↓
3. THEME-MCP:
   - Loads pendrop.yml from project
   - Resolves transformation package for 'penpot'
   - Loads prompts.yaml from transformation package
   - Loads examples (if available)
   - Loads target schema (pendrop.schema.ds.json)
   - Builds comprehensive instructions
   - Returns { instructions, mcp_calls, rules, examples }
   ↓
4. AI reads instructions and executes:
   
   Step 1: Extract
   AI calls penpot-mcp.extract_file({
     file_url: "...",
     auth: { username: "...", password: "..." }
   })
   → Returns raw Penpot JSON
   
   Step 2: Transform
   AI applies transformation rules:
   - Extracts tokens (W3C DTCG format)
   - Identifies components
   - Generates story variants
   - Follows naming conventions
   → Produces pendrop.data.ds.json
   
   Step 3: Validate
   AI calls theme-mcp.validate_design_data({
     data: <transformed>,
     schema_type: "ds"
   })
   → Returns { valid: true/false, errors: [...] }
   
   If invalid: AI reviews errors and fixes transformation
   
   Step 4: Save
   AI calls theme-mcp.save_design_data({
     data: <validated>,
     project_path: "/path/to/project"
   })
   → Saves to .pendrop/dist/pendrop.data.ds.json
   
   ↓
5. AI reports to user: "✓ Design system transformed and saved"
```

## Configuration: pendrop.yml

Project configuration file that defines:

```yaml
# Project metadata
project:
  type: drupal                # Target platform
  name: my-project
  theme: my_theme             # Theme name

# Design sources
design:
  urls:                       # Multiple design files supported
    - https://design.penpot.app/#/view/proj/file1
    - https://design.penpot.app/#/view/proj/file2
  auth:
    penpot:
      username: user@example.com
      password: secret
    figma:
      token: figma-token

# Rules configuration
rules:
  # Transformation packages (tool → package mapping)
  transformations:
    penpot: pendrop-penpot              # Built-in
    figma: ./design/my-figma-rules      # Custom
  
  # Project-specific convention overrides
  custom_rules_path: ./design/rules
```

## File Locations

Projects follow this structure:

```
project-root/
├── pendrop.yml                     # Configuration
├── .pendrop/
│   └── dist/
│       └── pendrop.data.ds.json    # Generated design system data
├── design/                         # Design source data (optional)
│   ├── pendrop.data.content.json   # Content structure
│   └── rules/                      # Custom rules (optional)
└── web/themes/custom/{theme}/      # Drupal theme (for Drupal projects)
    ├── components/                 # Generated components
    ├── .storybook/                 # Storybook config
    └── ...
```

Paths are determined by:
1. Target conventions (`rules/targets/{type}/conventions.yaml`)
2. Project overrides (`pendrop.yml` → `rules.custom_rules_path`)

## Extending Pendrop

### Adding a New Design Tool

1. **Create Extraction MCP**:
   - Implement `extract_file(url, auth) → raw_data`
   - Return tool-specific raw data (no transformation)

2. **Create Transformation Package**:
   ```
   rules/transformations/pendrop-{tool}/
   ├── prompts.yaml
   └── examples/
       ├── simple-input.json
       └── simple-output.json
   ```

3. **Write Transformation Instructions** (`prompts.yaml`):
   - Describe source data structure
   - Explain token extraction
   - Explain component extraction
   - Provide examples

4. **Configure in Project** (`pendrop.yml`):
   ```yaml
   rules:
     transformations:
       my-tool: ./my-transformations/pendrop-my-tool
   ```

### Adding a New Target Platform

1. **Create Target Conventions**:
   ```
   rules/targets/{platform}/
   ├── conventions.yaml
   ├── prompts.yaml
   └── story.yaml
   ```

2. **Define Conventions** (`conventions.yaml`):
   - Naming conventions
   - File paths
   - Structure (file formats, etc.)

3. **Configure in Project** (`pendrop.yml`):
   ```yaml
   project:
     type: my-platform
   ```

### Creating Custom Transformation Package

1. **Create Package Structure**:
   ```
   my-project/design/my-penpot-transform/
   ├── prompts.yaml
   └── examples/
   ```

2. **Write Custom Instructions** (`prompts.yaml`):
   - Customize token extraction logic
   - Define custom component patterns
   - Add project-specific hints

3. **Configure** (`pendrop.yml`):
   ```yaml
   rules:
     transformations:
       penpot: ./design/my-penpot-transform
   ```

## Benefits Summary

✓ **AI-Powered**: AI performs transformations, handles diverse data
✓ **Flexible**: Change workflow by changing prompts
✓ **Transparent**: AI explains what it's doing
✓ **Error-Resilient**: AI can retry and fix errors
✓ **Extensible**: Add new tools/platforms easily
✓ **Customizable**: Override any transformation package
✓ **Shareable**: Packages can be shared as npm modules (future)
✓ **Simple**: No complex MCP-to-MCP communication

## Future Enhancements

- NPM package support for transformation packages
- Web UI for transformation rule editing
- Visual diff tool for design changes
- Incremental updates (only changed components)
- Multi-file design system support
- Design token sync (bidirectional)
