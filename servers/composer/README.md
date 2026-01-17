# Pendrop Composer MCP Server

MCP server for composing AI instruction prompts from workflow configurations. The composer loads workflow definitions and variables to generate comprehensive instructions for AI workflows.

## Overview

The Composer MCP server acts as a **prompt generator** that transforms declarative workflow configurations into detailed AI instructions. It reads:

1. **Project configuration** from `pendrop.yml`
2. **Workflow definitions** (YAML files defining steps, tasks, assets, and variables)

It combines them into a single instruction prompt that guides the AI through the complete workflow.

## Core Paradigm

**The Composer generates INSTRUCTIONS, not results.**

The AI reads the composed instructions and executes the workflow by calling appropriate MCP tools based on those instructions.

## Installation & Build

```bash
cd servers/composer
npm install
npm run build
```

The built server will be available at `dist/index.js`.
The CLI tool is available at `dist/cli.js`.

## Configuration

The configuration is centered around `pendrop.yml` in your project root. It supports modular workflows using `!include` and workflow inheritance.

### Example 1: Basic Configuration

`pendrop.yml`:
```yaml
workflows:
  design-extract:
    steps:
      init:
        description: "Initialization"
        prompt: "You are an AI assistant..."
    tasks:
      main:
        description: "Main Task"
        step: init
        prompt: "Analyze the design."
```

### Example 2: Modular Workflow with Includes

You can split your configuration into multiple files using the `!include` tag.

`pendrop.yml`:
```yaml
# Include workflow definition from external file
workflows:
  design-extract: !include ./workflows/design-extract.yaml
```

`workflows/design-extract.yaml`:
```yaml
variables:
  source_tool: penpot

# Include steps from shared library
steps: !include ../steps/common-steps.yaml

tasks:
  extract-tokens:
    step: extract-tokens
    prompt: |
      ### Instructions
      Extract tokens from API...
```

### Example 3: Workflow Inheritance & Overrides

You can extend a base workflow and override variables or assets using the `source` property.

`pendrop.yml`:
```yaml
variables:
  global_key: "my-api-key"

workflows:
  design-extract:
    source: "./workflows/base-workflow.yaml"
    variables:
      # Override variable from base workflow
      target_format: "json"
      # Reference other variables
      output_path: "./output/{{target_format}}"
```

## Path Resolution

Paths used in `!include`, `source`, and asset definitions are resolved as follows:

1. **URL**: Starts with `http://` or `https://`.
2. **Package**: Starts with `npm://<package-name>/path/to/file`.
3. **Absolute**: Starts with `/`.
4. **Relative**: Starts with `./` or `../`.
   - Relative paths are resolved relative to the **file containing the reference**.

## Usage

### CLI Tool

You can use the standalone CLI to run workflows directly:

```bash
# Run the default workflow (all tasks)
node dist/cli.js run /path/to/project design-extract

# Run a specific task within the workflow
node dist/cli.js run /path/to/project design-extract extract-tokens

# Filter by step
node dist/cli.js run /path/to/project design-extract --step init

# Use custom configuration file
node dist/cli.js run /path/to/project design-extract --config custom-pendrop.yml

# Override variables at runtime
node dist/cli.js run /path/to/project design-extract -v source_tool=figma
```

### MCP Tools

The server exposes the following tools:

#### `compose_workflow`
Generates the AI instructions for a workflow.

```json
{
  "workflow": "design-extract",
  "project_path": "/path/to/project",
  "pendrop_file": "custom-pendrop.yml", // Optional: Custom config file
  "task": "extract-tokens", // Optional: Run specific task
  "step": "init", // Optional: Filter by step
  "variables": { "source_tool": "figma" } // Optional: Overrides
}
```

#### `extract_asset`
Extracts data from a defined asset using JSONPath.

```json
{
  "asset_id": "schema_url",
  "jsonpath": "$.definitions.component",
  "project_path": "/path/to/project",
  "workflow": "design-extract"
}
```

#### `save_asset`
Saves data to a writeable asset, with support for deep merging.

```json
{
  "asset_id": "design_data",
  "data": { ... },
  "project_path": "/path/to/project",
  "workflow": "design-extract",
  "options": { "merge": true }
}
```
