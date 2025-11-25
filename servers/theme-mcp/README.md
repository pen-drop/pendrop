# Theme MCP Server

AI orchestrator MCP server for design system extraction and transformation. Returns instructions/prompts for AI to execute, coordinating between extraction MCPs and generation tasks.

## Overview

Theme MCP acts as an **AI orchestrator** that provides instructions for transforming design files into code. It's **design-tool agnostic** and works with any extraction MCP (Penpot, Figma, Sketch, etc.).

Instead of directly transforming data, it returns detailed prompts that guide the AI through the complete workflow.

## Core Paradigm

**MCPs return PROMPTS/INSTRUCTIONS, not results.**

The AI reads instructions and orchestrates the workflow by calling multiple MCPs based on those instructions.

**Design Tool Agnostic:**
- Works with `penpot-mcp`, `figma-mcp`, or any future design tool MCP
- Extraction rules are configurable per design tool
- Easy to add support for new design tools

## Architecture

```
User/AI
  ↓
theme-mcp.extract_design_data(url, project_path)
  ↓ (analyzes URL and pendrop.yml)
  ↓
Returns INSTRUCTIONS:
  "1. Call {design-tool-mcp}.extract_file(url)
      → penpot-mcp for Penpot URLs
      → figma-mcp for Figma URLs
      → sketch-mcp for Sketch files (future)
   2. Transform data using tool-specific rules
   3. Validate with theme-mcp.validate_design_data()
   4. Save with theme-mcp.save_design_data()"
  ↓
AI executes instructions:
  → Calls appropriate extraction MCP
  → Transforms data using AI + tool-specific rules
  → Validates with theme-mcp
  → Saves with theme-mcp
```

**Supported Design Tools:**
- ✅ **Penpot** - via `penpot-mcp` ([docs](../penpot-mcp/README.md))
- ✅ **Figma** - via `figma-mcp` (planned)
- 🔄 **Sketch** - Easy to add with custom extraction rules
- 🔄 **Adobe XD** - Easy to add with custom extraction rules

## Tools

### `extract_design_data(design_url, project_path)`

**Main orchestration tool** - Returns AI instructions for extracting and transforming design data.

**What it does:**
1. Analyzes design URL and `pendrop.yml` to determine design tool
2. Selects appropriate extraction MCP:
   - `penpot-mcp` for `design.penpot.app` URLs
   - `figma-mcp` for `figma.com` URLs
   - Custom MCP based on configuration
3. Loads tool-specific extraction rules (e.g., `pendrop-penpot`, `pendrop-figma`)
4. Returns detailed AI prompt with:
   - Step-by-step instructions
   - Which extraction MCP to call with auth details
   - Tool-specific extraction rules (W3C DTCG format, component structure, etc.)
   - Validation and save steps

**Parameters:**
- `design_url` (string): URL to design file
- `project_path` (string): Path to project root (where `pendrop.yml` is located)

**Returns:**
```json
{
  "success": true,
  "prompt": "You are an AI assistant tasked with orchestrating a design system workflow.\n\n1. Extract Raw Design Data:\n   Call penpot-mcp.extract_file with {...}\n\n2. Transform to Pendrop Theme Format:\n   Using these rules: {...}\n\n3. Validate: theme-mcp.validate_design_data\n4. Save: theme-mcp.save_design_data"
}
```

**Example Call:**
```json
{
  "design_url": "https://design.penpot.app/#/view/abc123/file-xyz",
  "project_path": "/home/user/my-drupal-project"
}
```

### `extract_design_system(source_data, source_tool, project_path)`

Returns AI instructions for transforming raw design data to `pendrop.theme.json` format.

**Parameters:**
- `source_data` (object): Raw design data from extraction MCP
- `source_tool` (string): Source design tool (`penpot`, `figma`, `sketch`, etc.)
- `project_path` (string): Path to project root

**Returns:** AI instructions with tool-specific extraction rules

**Supported Source Tools:**
- `penpot` - Penpot design files
- `figma` - Figma design files
- Custom tools via extraction packages

### `validate_design_data(data, schema_type)`

Validates transformed design data against Pendrop schemas.

**Parameters:**
- `data` (object): The transformed design data
- `schema_type` (string): `"theme"` or `"content"`

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
  ]
}
```

### `save_design_data(data, project_path)`

Saves validated design data to `.pendrop/dist/pendrop.data.theme.json`.

**Parameters:**
- `data` (object): The validated design data
- `project_path` (string): Path to project root

**Returns:**
```json
{
  "success": true,
  "path": ".pendrop/dist/pendrop.data.theme.json"
}
```

### Generation Tools (Prompts)

These tools return AI instructions for code generation:

- `generate_component(component_id, project_path)` - Returns instructions for generating component code
- `generate_story(component_id, project_path)` - Returns instructions for generating Storybook stories

## Extraction Packages

Extraction rules are organized into **packages** that define how to transform a specific design tool's data to Pendrop format. **Each design tool has its own extraction package.**

### Package Structure

```
rules/theme/extraction/
├── pendrop-penpot/          # Penpot → Pendrop (built-in)
│   ├── prompts.yaml         # AI extraction instructions
│   └── examples/            # Example input/output pairs
│       ├── simple-input.json
│       └── simple-output.json
├── pendrop-figma/           # Figma → Pendrop (built-in)
│   ├── prompts.yaml
│   └── examples/
├── pendrop-sketch/          # Sketch → Pendrop (community/custom)
│   ├── prompts.yaml
│   └── examples/
└── pendrop-adobexd/         # Adobe XD → Pendrop (community/custom)
    ├── prompts.yaml
    └── examples/
```

**Adding a New Design Tool:**

To support a new design tool (e.g., Sketch):
1. Create an extraction package: `rules/theme/extraction/pendrop-sketch/`
2. Write `prompts.yaml` with tool-specific extraction instructions
3. Add extraction MCP (e.g., `sketch-mcp`) or use existing API
4. Configure in `pendrop.yml`

### Custom Extraction Packages

Projects can override or add extraction rules by configuring custom packages in `pendrop.yml`:

```yaml
rules:
  extraction:
    # Built-in packages (default)
    penpot: pendrop-penpot
    figma: pendrop-figma
    
    # Custom/override packages
    penpot: ./design/my-penpot-rules    # Override Penpot rules
    sketch: ./design/sketch-rules       # Add Sketch support
    
    # NPM packages (future)
    figma: @company/figma-transform     # Company-specific Figma rules
    adobexd: @community/adobexd-pendrop # Community package
```

**Example: Adding Sketch Support**

1. Create package structure:
```
my-project/design/sketch-rules/
├── prompts.yaml
└── examples/
    ├── sketch-input.json
    └── expected-output.json
```

2. Configure in `pendrop.yml`:
```yaml
rules:
  extraction:
    sketch: ./design/sketch-rules
```

3. Use with Sketch extraction MCP or API

A custom package must have the same structure:
- `prompts.yaml` - Extraction instructions
- `examples/` - Optional example extractions

## Configuration

Projects configure Pendrop via `pendrop.yml` in the project root:

```yaml
project:
  type: drupal
  name: my-project
  theme: my_theme

design:
  url: https://design.penpot.app/#/view/...
  # OR multiple URLs:
  # urls:
  #   - https://design.penpot.app/#/view/...
  #   - https://figma.com/file/...

rules:
  custom_rules_path: ./design/rules
  extraction:
    penpot: pendrop-penpot  # or custom path
    figma: pendrop-figma
```

**Note:** Authentication is handled by each extraction MCP server (not in `pendrop.yml`):
- **penpot-mcp**: Configure via `PENPOT_USERNAME`, `PENPOT_PASSWORD`, or `PENPOT_TOKEN` environment variables
- **figma-mcp**: Configure via `FIGMA_TOKEN` environment variable
- See each MCP server's documentation for authentication setup

## Cursor Integration

### MCP Configuration

Add to your Cursor MCP settings (`.cursor/mcp.json` or global settings):

```json
{
  "mcpServers": {
    "theme-mcp": {
      "command": "node",
      "args": ["/path/to/pendrop/servers/theme-mcp/dist/index.js"],
      "env": {
        "THEME_MCP_CONFIG": "/path/to/pendrop/servers/theme-mcp/config.json"
      }
    },
    "penpot-mcp": {
      "command": "node",
      "args": ["/path/to/pendrop/servers/penpot-mcp/dist/index.js"]
    },
    "figma-mcp": {
      "command": "node",
      "args": ["/path/to/pendrop/servers/figma-mcp/dist/index.js"],
      "env": {
        "FIGMA_TOKEN": "your-figma-api-token"
      }
    }
  }
}
```

**Note:** Only add the extraction MCPs for the design tools you're using. `theme-mcp` works with any of them.

### Example Usage in Cursor

**Example 1: Penpot Design System**

```
User: Transform my Penpot design system from the URL in pendrop.yml
Project path: /home/user/my-drupal-project
```

```
AI: I'll extract and transform your design system.

[Calls theme-mcp.extract_design_data]
↓ (detects Penpot URL)
[Receives instructions: "Call penpot-mcp.extract_file..."]
↓
[Calls penpot-mcp.extract_file with auth from pendrop.yml]
↓
[Receives raw Penpot JSON]
↓
[AI transforms data using Penpot→Pendrop rules]
↓
[Validates and saves]
↓
✓ Design system saved to .pendrop/dist/pendrop.data.theme.json
```

**Example 2: Figma Design System**

```
User: Extract my Figma design to Drupal components
Figma URL: https://figma.com/file/abc123/MyDesign
Project: /home/user/drupal-demo
```

```
AI: I'll extract and transform your Figma design.

[Calls theme-mcp.extract_design_data]
↓ (detects Figma URL)
[Receives instructions: "Call figma-mcp.get_file..."]
↓
[Calls figma-mcp.get_file with API token]
↓
[Receives Figma REST API JSON]
↓
[AI transforms data using Figma→Pendrop rules]
↓
[Validates and saves]
↓
✓ Design system saved
```

**Example 3: Multiple Design Tools**

```
User: I have components in both Penpot and Figma. Extract and merge them.
```

```
AI: I'll extract from both tools and merge the design systems.

[Extracts from Penpot using penpot-mcp]
[Extracts from Figma using figma-mcp]
[Merges tokens and components]
[Validates merged result]
[Saves unified design system]
✓ Merged design system with components from both tools
```

**Step 3: Generate components**

```
User: Generate the Button component from the design system

AI: [Calls theme-mcp.generate_component("button", "/project/path")]
    [Receives instructions for Drupal SDC component]
    [Generates component.yml, template.twig, and component.js]
    ✓ Button component generated in web/themes/custom/my_theme/components/button/
```

### Practical Example: Multi-Tool Workflow

```typescript
// AI orchestrates workflows for any design tool

// PENPOT WORKFLOW
const penpotInstructions = await theme_mcp.extract_design_data({
  design_url: "https://design.penpot.app/#/view/...",
  project_path: "/home/user/drupal-demo"
});
// → Instructions tell AI to call penpot-mcp

const penpotData = await penpot_mcp.extract_file({
  file_url: "https://design.penpot.app/#/view/...",
  auth: { username: "...", password: "..." }
});

const transformedPenpot = transformUsingRules(
  penpotData,
  penpotInstructions.rules // Penpot-specific rules
);

// FIGMA WORKFLOW
const figmaInstructions = await theme_mcp.extract_design_data({
  design_url: "https://figma.com/file/abc123/...",
  project_path: "/home/user/drupal-demo"
});
// → Instructions tell AI to call figma-mcp

const figmaData = await figma_mcp.get_file({
  file_key: "abc123",
  auth: { token: "..." }
});

const transformedFigma = transformUsingRules(
  figmaData,
  figmaInstructions.rules // Figma-specific rules
);

// MERGE & VALIDATE
const merged = mergeDesignSystems(transformedPenpot, transformedFigma);

const validation = await theme_mcp.validate_design_data({
  data: merged,
  schema_type: "theme"
});

if (validation.valid) {
  await theme_mcp.save_design_data({
    data: merged,
    project_path: "/home/user/drupal-demo"
  });
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

# Run tests (Vitest)
npm test
npm run test:watch
npm run test:coverage
npm run test:ui

# Lint
npm run lint
npm run lint:fix

# Type check
npm run type-check
```

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration:

**Workflow:** `.github/workflows/theme-mcp-ci.yml`

**Jobs:**
- **Test & Lint** (Node 18.x, 20.x, 22.x)
  - TypeScript type checking
  - ESLint code quality
  - Vitest test suite
  - Build verification
  
- **Coverage**
  - Test coverage reports
  - Codecov integration
  
- **Lint Schemas**
  - JSON schema validation
  - YAML extraction rules validation
  
- **Security**
  - npm audit for vulnerabilities

**Triggers:**
- Push to `1.x` branch
- Pull requests to `1.x` branch
- Changes in `servers/theme-mcp/`, `schemas/`, or `rules/` directories

## Complete Workflow Example

### Scenario: Transform Design System to Drupal Components

*This example uses Penpot, but the workflow is identical for Figma, Sketch, or any other design tool with an extraction MCP.*

```
┌─────────────────────────────────────────────────────────────────┐
│ USER in Cursor Chat                                             │
├─────────────────────────────────────────────────────────────────┤
│ "Extract my Penpot design system and generate the components"  │
│ Project: /home/user/drupal-demo                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: AI calls theme-mcp.extract_design_data                 │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   "design_url": "https://design.penpot.app/#/view/abc/xyz",   │
│   "project_path": "/home/user/drupal-demo"                     │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ THEME-MCP returns AI instructions                               │
├─────────────────────────────────────────────────────────────────┤
│ "You are orchestrating a design system workflow.               │
│                                                                 │
│ 1. Call penpot-mcp.extract_file with:                          │
│    { file_url: "...", auth: { username: "...", ... } }        │
│                                                                 │
│ 2. Transform the raw data to pendrop.theme.json format:        │
│    - Tokens: Use W3C DTCG format ($value, $type)              │
│    - Components: Extract props, slots, variants               │
│    - Stories: Create variants for each component state        │
│                                                                 │
│ 3. Validate: theme-mcp.validate_design_data(data, 'theme')    │
│ 4. Save: theme-mcp.save_design_data(data, project_path)"      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: AI calls penpot-mcp.extract_file                       │
├─────────────────────────────────────────────────────────────────┤
│ Returns: Raw Penpot JSON (pages, objects, fills, etc.)         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: AI transforms data using instructions                   │
├─────────────────────────────────────────────────────────────────┤
│ Converts:                                                       │
│   Penpot fills → W3C DTCG color tokens                         │
│   Penpot components → Pendrop components with props            │
│   Component instances → Story variants                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: AI validates with theme-mcp.validate_design_data       │
├─────────────────────────────────────────────────────────────────┤
│ Result: { valid: true, message: "✓ Valid pendrop.theme.json" }│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: AI saves with theme-mcp.save_design_data               │
├─────────────────────────────────────────────────────────────────┤
│ Saved to: .pendrop/dist/pendrop.data.theme.json                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: AI generates components                                 │
├─────────────────────────────────────────────────────────────────┤
│ For each component:                                             │
│   1. theme-mcp.generate_component("button", project_path)      │
│   2. AI receives generation instructions                        │
│   3. AI creates Drupal SDC files:                              │
│      - component.yml (metadata + props)                         │
│      - template.twig (markup)                                   │
│      - component.js (behavior)                                  │
│      - component.css (styles from tokens)                       │
│   4. theme-mcp.generate_story("button", project_path)          │
│   5. AI creates Storybook story with variants                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ AI → USER                                                        │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Design system extracted and saved                            │
│ ✓ Generated 5 components:                                       │
│   - Button (web/themes/custom/my_theme/components/button/)     │
│   - Card (web/themes/custom/my_theme/components/card/)         │
│   - Header (web/themes/custom/my_theme/components/header/)     │
│   ...                                                            │
│ ✓ Generated Storybook stories                                   │
│                                                                 │
│ You can now run: npm run storybook                             │
└─────────────────────────────────────────────────────────────────┘
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

**Step 1: Create Extraction Package**

```bash
mkdir -p rules/theme/extraction/pendrop-{tool}
cd rules/theme/extraction/pendrop-{tool}
```

**Step 2: Create `prompts.yaml`**

```yaml
version: "1.0"
source: {tool}  # e.g., sketch, adobexd
target_schema: "pendrop.theme.json"
target_schema_url: "https://raw.githubusercontent.com/pen-drop/pendrop/1.x/schemas/pendrop.theme.json"

instructions: |
  You are transforming {Tool} design file data to Pendrop format.
  
  {Tool} data structure:
  - Document structure: {...}
  - Component format: {...}
  - Style properties: {...}
  
  Your goal: Extract tokens, components, and stories.

tokens_instructions: |
  Extract design tokens from {Tool}:
  - Colors: {tool-specific extraction}
  - Typography: {tool-specific extraction}
  - Spacing: {tool-specific extraction}

components_instructions: |
  Extract components from {Tool}:
  - Symbols/Components: {tool-specific mapping}
  - Props/Overrides: {tool-specific mapping}

stories_instructions: |
  Generate stories for each component...

naming:
  tokens: "kebab-case"
  components: "kebab-case"
  props: "camelCase"
```

**Step 3: Create Extraction MCP (Optional)**

If no MCP exists for your design tool, create one:

```bash
mkdir -p servers/{tool}-mcp
# Implement extraction MCP that outputs raw design data
```

Or use existing APIs/formats (Sketch JSON export, etc.)

**Step 4: Configure in Project**

```yaml
# pendrop.yml
rules:
  extraction:
    {tool}: pendrop-{tool}
    
design:
  url: {tool-specific-url-or-file-path}
  auth:
    {tool}:
      api_key: "..."
```

**Step 5: Test**

```bash
# In Cursor Chat
"Extract my {Tool} design system
URL: {url}
Project: /path/to/project"
```

### Adding a New Target Platform

1. Create conventions in `rules/theme/targets/{platform}/`
2. Define naming, paths, and structure conventions
3. Configure in project's `pendrop.yml`

**Supported Targets:**
- ✅ **Drupal** - Full SDC component generation
- 🔄 **Vue.js** - Vue SFC generation (planned)
- 🔄 **React** - React component generation (planned)
- 🔄 **Angular** - Angular component generation (planned)

