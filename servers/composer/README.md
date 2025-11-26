# Pendrop Composer MCP Server

MCP server for composing AI instruction prompts from pipeline configurations defined in `pendrop.yml`. The composer loads pipeline definitions, task templates, and variables to generate comprehensive instructions for AI workflows.

## Overview

The Composer MCP server acts as a **prompt generator** that transforms declarative pipeline configurations into detailed AI instructions. It reads:

1. **Pipeline configurations** from `pendrop.yml` in your project
2. **Task packages** from `composer/tasks/` (containing step templates and variables)
3. **Pipeline definitions** from `composer/pipelines/` (containing step structure and schemas)

And combines them into a single instruction prompt that guides the AI through the complete workflow.

## Core Paradigm

**The Composer generates INSTRUCTIONS, not results.**

The AI reads the composed instructions and executes the workflow by calling appropriate MCP tools based on those instructions.

## Architecture

```
User/AI
  ↓
composer.compose_pipeline(pipeline, project_path)
  ↓ (loads pendrop.yml)
  ↓ (loads tasks from composer/tasks/)
  ↓ (loads pipeline from composer/pipelines/)
  ↓
Returns INSTRUCTIONS:
  "# Step: Initialization and Global Context
  
   You are extracting and transforming a penpot design file...
   
   # Step: Extract Source Data
   
   Use penpot-mcp.get_object_tree to extract...
   
   # Step: Transform Tokens
   
   Extract design tokens in W3C DTCG format..."
  ↓
AI executes instructions:
  → Calls extraction MCPs (penpot-mcp, figma-mcp, etc.)
  → Transforms data using AI
  → Validates with theme-mcp
  → Saves with theme-mcp
```

## Installation & Build

### Prerequisites

- Node.js 20.x or higher
- npm

### Build

```bash
cd servers/composer
npm install
npm run build
```

The built server will be available at `dist/index.js`.

## Configuration

### pendrop.yml Structure

Create a `pendrop.yml` file in your project root:

```yaml
# Pipeline configuration
pipelines:
  design-extract:
    tasks: pendrop-penpot
    variables:
      design_url: https://penpot.keytec.de/#/workspace?team-id=...&file-id=...
      # Add any other variables needed by your pipeline
```

**Pipeline Configuration:**
- `pipelines`: Object mapping pipeline names to their configurations
  - `tasks`: Name of the task package (e.g., `pendrop-penpot`) - must exist in `composer/tasks/`
  - `variables`: Key-value pairs of variables to substitute in templates

**Variable Substitution:**
Variables use `{{variable_name}}` syntax in task templates. The composer automatically substitutes:
- Variables from `pendrop.yml` pipeline configuration
- Variables from task package defaults
- Runtime variables (passed when calling the tool)
- Built-in variables: `project_path`, `target_schema`

**Variable Priority (highest to lowest):**
1. Runtime variables (passed to `compose_pipeline`)
2. Pipeline variables (from `pendrop.yml`)
3. Task variables (from `composer/tasks/<package>/tasks.yml`)

## Usage

### With MCP Client Tool

The Pendrop project includes an MCP client tool for testing MCP servers.

**Build the client:**
```bash
npm run build --prefix tools/mcp-client
```

**List available tools:**
```bash
npm run mcp:test -- --server composer
```

**Compose a pipeline:**
```bash
npm run mcp:test -- --server composer compose_pipeline \
  --pipeline "design-extract" \
  --project_path "/path/to/your/project"
```

**Compose specific steps:**
```bash
npm run mcp:test -- --server composer compose_pipeline \
  --pipeline "design-extract" \
  --project_path "/path/to/your/project" \
  --step "transform-tokens"
```

**With runtime variables:**
```bash
npm run mcp:test -- --server composer compose_pipeline \
  --pipeline "design-extract" \
  --project_path "/path/to/your/project" \
  --variables '{"custom_var": "value"}'
```

### With Cursor/Other MCP Clients

Add the composer server to your MCP client configuration.

**Location:** Cursor Settings → Features → Model Context Protocol

Or edit: `~/.cursor/mcp.json` (Linux/Mac) or `%APPDATA%\Cursor\mcp.json` (Windows)

```json
{
  "mcpServers": {
    "composer": {
      "command": "node",
      "args": ["/absolute/path/to/pendrop/servers/composer/dist/index.js"]
    }
  }
}
```

**Note:** Use absolute paths for the server executable.

After adding the server, restart Cursor to load the new MCP server.

## Tool Reference

### `compose_pipeline`

Composes an AI instruction prompt from a pipeline configuration in `pendrop.yml`.

**Parameters:**
- `pipeline` (string, required): Name of the pipeline as configured in `pendrop.yml`
- `project_path` (string, required): Path to the project root containing `pendrop.yml`
- `step` (string | string[], optional): Specific step ID(s) to run (includes dependencies). If not provided, all steps are included.
- `variables` (object, optional): Additional variables for template substitution (overrides config)

**Returns:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "# Step: Initialization and Global Context\n\nYou are extracting...\n\n# Step: Extract Source Data\n\n..."
    }
  ]
}
```

**How it works:**
1. Loads `pendrop.yml` from `project_path`
2. Resolves the task package from the pipeline configuration
3. Loads task templates from `composer/tasks/<package>/tasks.yml`
4. Loads pipeline definition from `composer/pipelines/<pipeline-name>/pipeline.yaml`
5. Resolves step dependencies (if specific steps requested)
6. Merges variables (runtime > pipeline > task defaults)
7. Substitutes variables in templates using `{{variable_name}}` syntax
8. Assembles final instructions with step headers and templates

**Step Dependencies:**
Steps can declare dependencies. If you request a specific step, all its dependencies are automatically included. Steps are executed in dependency order.

**Example:**
```yaml
# pipeline.yaml
steps:
  init:
    description: "Initialization"
  extract:
    description: "Extract data"
    dependencies: ["init"]
  transform:
    description: "Transform data"
    dependencies: ["extract"]
```

If you request `transform`, the composer will include `init` → `extract` → `transform` in that order.

## Examples

### Basic Pipeline Composition

**pendrop.yml:**
```yaml
pipelines:
  design-extract:
    tasks: pendrop-penpot
    variables:
      design_url: https://penpot.keytec.de/#/workspace?team-id=...&file-id=...
```

**Call:**
```bash
npm run mcp:test -- --server composer compose_pipeline \
  --pipeline "design-extract" \
  --project_path "/home/user/my-project"
```

**Result:** Full instruction prompt with all steps from the pipeline.

### Running Specific Steps

**Call:**
```bash
npm run mcp:test -- --server composer compose_pipeline \
  --pipeline "design-extract" \
  --project_path "/home/user/my-project" \
  --step "transform-tokens"
```

**Result:** Instruction prompt with only `init` and `transform-tokens` steps (dependencies included).

### Overriding Variables

**Call:**
```bash
npm run mcp:test -- --server composer compose_pipeline \
  --pipeline "design-extract" \
  --project_path "/home/user/my-project" \
  --variables '{"design_url": "https://different-url.com"}'
```

**Result:** Instruction prompt with `design_url` overridden to the new value.

### Multiple Steps

**Call:**
```bash
npm run mcp:test -- --server composer compose_pipeline \
  --pipeline "design-extract" \
  --project_path "/home/user/my-project" \
  --step '["transform-tokens", "transform-components"]'
```

**Result:** Instruction prompt with both steps and their dependencies.

## Pipeline Structure

### Task Packages (`composer/tasks/<package>/tasks.yml`)

Task packages define:
- **Variables**: Default variables for the pipeline
- **Steps**: Step templates with `{{variable}}` placeholders
- **Pipeline reference**: Which pipeline definition to use

**Example:**
```yaml
version: "1.0"
source: penpot
pipeline: pendrop-design-extract

variables:
  source_tool: "penpot"
  extraction_rules: |
    - Objects named "token" are likely tokens
    - Look for naming patterns

steps:
  init:
    template: |
      You are extracting a {{source_tool}} design file...
  extract-source:
    template: |
      Use {{source_tool}}-mcp.get_object_tree...
```

### Pipeline Definitions (`composer/pipelines/<name>/pipeline.yaml`)

Pipeline definitions define:
- **Steps**: Step structure with descriptions and dependencies
- **Schema**: Target schema for validation (loaded from `schema.json`)

**Example:**
```yaml
version: "1.0"
description: "Design System Extraction Pipeline"

steps:
  init:
    description: "Initialization and Global Context"
  extract-source:
    description: "Extract Source Data"
    dependencies: ["init"]
  transform-tokens:
    description: "Transform Tokens"
    dependencies: ["extract-source"]
```

## Troubleshooting

**Pipeline not found:**
- Ensure `pendrop.yml` exists in `project_path`
- Check that the pipeline name matches exactly (case-sensitive)
- Verify the pipeline is defined under `pipelines:` in `pendrop.yml`

**Task package not found:**
- Ensure the task package exists in `composer/tasks/<package>/`
- Verify the `tasks:` field in `pendrop.yml` matches the package name
- Check that `tasks.yml` exists in the task package directory

**Pipeline definition not found:**
- Ensure the pipeline definition exists in `composer/pipelines/<name>/`
- Verify the `pipeline:` field in `tasks.yml` matches the pipeline name
- Check that `pipeline.yaml` exists in the pipeline directory

**Step not found:**
- Verify the step ID exists in the pipeline definition
- Check step dependencies are correctly defined
- Ensure step templates exist in `tasks.yml` if the step requires a template

**Variable not substituted:**
- Check variable name matches exactly (case-sensitive)
- Verify variable is defined in one of: runtime, pipeline config, or task defaults
- Ensure `{{variable_name}}` syntax is correct in templates

## Related Documentation

- [MCP Integration Guide](../../docs/MCP_INTEGRATION.md) - General MCP setup
- [Theme MCP Server](../theme-mcp/README.md) - Design system orchestration
- [Penpot MCP Server](../penpot-mcp/README.md) - Penpot integration
- [MCP Client Tool](../../tools/mcp-client/README.md) - Testing MCP servers

