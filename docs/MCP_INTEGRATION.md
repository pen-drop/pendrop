# MCP Integration Guide

This guide explains how to integrate Pendrop MCP servers with AI assistants like Cursor.

**Pendrop is design-tool agnostic** - it works with Penpot, Figma, Sketch, and any other design tool through extraction MCPs. You only need to install the MCPs for the design tools you're using.

## Prerequisites

1. **Build the MCP servers**:
```bash
# Build theme-mcp (required - orchestrates all workflows)
cd servers/theme-mcp
npm install
npm run build

# Build extraction MCPs for your design tools

# For Penpot
cd ../penpot-mcp
npm install
npm run build

# For Figma (if available)
cd ../figma-mcp
npm install
npm run build

# For other tools, install their respective MCPs
```

2. **Create configuration file**:
```bash
# Copy example config
cd servers/theme-mcp
cp config.example.json config.json

# Edit if needed
# {
#   "target": "drupal",
#   "rulesPath": "../../rules",
#   "projectRules": null
# }
```

## Cursor Integration

### Global Configuration

Add MCP servers to Cursor's global settings:

**Location:** Cursor Settings → Features → Model Context Protocol

Or edit: `~/.cursor/mcp.json` (Linux/Mac) or `%APPDATA%\Cursor\mcp.json` (Windows)

```json
{
  "mcpServers": {
    "theme-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/pendrop/servers/theme-mcp/dist/index.js"],
      "env": {
        "THEME_MCP_CONFIG": "/absolute/path/to/pendrop/servers/theme-mcp/config.json"
      }
    },
    "penpot-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/pendrop/servers/penpot-mcp/dist/index.js"],
      "env": {
        "PENPOT_USERNAME": "your-username",
        "PENPOT_PASSWORD": "your-password"
      }
    },
    "figma-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/pendrop/servers/figma-mcp/dist/index.js"],
      "env": {
        "FIGMA_TOKEN": "your-figma-personal-access-token"
      }
    }
  }
}
```

**Authentication:**
- `theme-mcp` is **required** - it orchestrates all workflows (no auth needed)
- Each extraction MCP handles its own authentication via environment variables
- Only add extraction MCPs for the design tools you're using

**Authentication by Tool:**
- **Penpot**: `PENPOT_USERNAME` + `PENPOT_PASSWORD` or `PENPOT_TOKEN`
- **Figma**: `FIGMA_TOKEN` (Personal Access Token)
- **Other tools**: See their MCP documentation

### Project-Specific Configuration

For project-specific configuration, create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "theme-mcp": {
      "command": "node",
      "args": ["../pendrop/servers/theme-mcp/dist/index.js"],
      "env": {
        "THEME_MCP_CONFIG": "../pendrop/servers/theme-mcp/config.json"
      }
    },
    "penpot-mcp": {
      "command": "node",
      "args": ["../pendrop/servers/penpot-mcp/dist/index.js"]
    }
  }
}
```

## Usage Examples

### Example 1: Extract Design System (Penpot)

**In Cursor Chat:**

```
Transform my Penpot design system to Drupal components.
Project path: /home/user/drupal-demo
```

**What happens:**

1. AI calls `theme-mcp.extract_design_data`
2. Theme MCP detects Penpot URL from `pendrop.yml`
3. Returns instructions to call `penpot-mcp.extract_file`
4. AI calls `penpot-mcp` with auth from `pendrop.yml`
5. Transforms data using Penpot→Pendrop rules (W3C DTCG format)
6. Validates with `theme-mcp.validate_design_data`
7. Saves with `theme-mcp.save_design_data`

**Result:** `.pendrop/dist/pendrop.data.theme.json` created

### Example 1b: Extract Design System (Figma)

**In Cursor Chat:**

```
Transform my Figma design system to Drupal components.
Figma URL: https://figma.com/file/abc123/MyDesign
Project path: /home/user/drupal-demo
```

**What happens:**

1. AI calls `theme-mcp.extract_design_data`
2. Theme MCP detects Figma URL
3. Returns instructions to call `figma-mcp.get_file`
4. AI calls `figma-mcp` with API token
5. Transforms data using Figma→Pendrop rules
6. Validates and saves

**Result:** `.pendrop/dist/pendrop.data.theme.json` created

### Example 1c: Multiple Design Tools

**In Cursor Chat:**

```
I have tokens in Penpot and components in Figma. 
Extract and merge them into one design system.
Project: /home/user/drupal-demo
```

**What happens:**

1. AI extracts tokens from Penpot using `penpot-mcp`
2. AI extracts components from Figma using `figma-mcp`
3. AI merges the data into unified `pendrop.theme.json` format
4. Validates and saves merged result

**Result:** Unified design system from multiple sources

### Example 2: Generate Component

**In Cursor Chat:**

```
Generate the Button component from my design system.
Project: /home/user/drupal-demo
```

**What happens:**

1. AI calls `theme-mcp.generate_component("button", "/home/user/drupal-demo")`
2. Receives component generation instructions
3. Creates Drupal SDC files:
   - `component.yml` - Metadata and props definition
   - `template.twig` - Component markup
   - `component.css` - Styles using design tokens
   - `component.js` - Component behavior

**Result:** Component created in `web/themes/custom/my_theme/components/button/`

### Example 3: Generate All Components

**In Cursor Chat:**

```
Generate all components from the design system.
Project: /home/user/drupal-demo
```

**What happens:**

1. AI reads `.pendrop/dist/pendrop.data.theme.json`
2. For each component in `components` object:
   - Calls `theme-mcp.generate_component`
   - Creates SDC files
   - Calls `theme-mcp.generate_story`
   - Creates Storybook story
3. Updates theme libraries

**Result:** All components and stories generated

## Troubleshooting

### MCP Server Not Found

**Error:** `MCP server 'theme-mcp' not found`

**Solution:**
1. Check that paths in `mcp.json` are absolute or correct relative paths
2. Verify the server was built: `ls servers/theme-mcp/dist/index.js`
3. Restart Cursor after updating `mcp.json`

### Build Errors

**Error:** `Cannot find module '...'`

**Solution:**
```bash
cd servers/theme-mcp
npm install
npm run build
```

### Permission Errors

**Error:** `EACCES: permission denied`

**Solution:**
```bash
chmod +x servers/theme-mcp/dist/index.js
chmod +x servers/penpot-mcp/dist/index.js
```

### Configuration Not Found

**Error:** `Config file not found`

**Solution:**
```bash
cd servers/theme-mcp
cp config.example.json config.json
```

Ensure `THEME_MCP_CONFIG` in `mcp.json` points to the correct config file.

## Advanced: Custom Transformation Rules

You can override transformation rules per project:

**In `pendrop.yml`:**

```yaml
rules:
  transformations:
    penpot: ./design/my-custom-rules
```

**Create custom rules package:**

```
my-drupal-project/
└── design/
    └── my-custom-rules/
        ├── prompts.yaml      # Custom transformation instructions
        └── examples/         # Optional examples
            ├── input.json
            └── output.json
```

**In `prompts.yaml`:**

```yaml
version: "1.0"
source: penpot
target_schema: "pendrop.theme.json"
target_schema_url: "https://raw.githubusercontent.com/pen-drop/pendrop/1.x/schemas/pendrop.theme.json"

instructions: |
  Your custom transformation instructions here...
  
  Override token extraction, component mapping, etc.

tokens_instructions: |
  Custom token extraction rules...

components_instructions: |
  Custom component mapping rules...

stories_instructions: |
  Custom story generation rules...

naming:
  tokens: "kebab-case"
  components: "PascalCase"
  props: "camelCase"
```

## Testing MCP Integration

Test if MCPs are working:

```bash
# In Cursor terminal or Chat
echo "List available MCP tools"
```

You should see tools from both `theme-mcp` and `penpot-mcp`.

## Further Reading

- [Theme MCP README](../servers/theme-mcp/README.md)
- [Penpot MCP README](../servers/penpot-mcp/README.md)
- [Pendrop Configuration](../examples/drupal-demo/README.md)
- [Architecture Documentation](./ARCHITECTURE.md)

