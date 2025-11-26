# MCP CLI Client

A generic command-line client for testing any MCP (Model Context Protocol) server in the Pendrop project.

## Setup

Build the client tool:

```bash
npm run build --prefix tools/mcp-client
```

## Usage

You can run the client via the root `package.json` script (once added) or directly using `tsx`.

### Run via NPM Script (Recommended)

```bash
npm run mcp:test -- --server <server-name> [--build] [--format pretty|compact|pretty-text] [tool-name] [args...]
```

**Flags:**
- `--server <name>`: Name of the MCP server to connect to (required)
- `--build`: Build the server before connecting (runs `npm run build` in the server directory)
- `--format <format>`: Output format for results (optional)
  - `pretty`: Pretty-printed JSON with syntax highlighting (default)
  - `compact`: Single-line compact JSON
  - `pretty-text`: Extract and render text content as formatted markdown (for prompts/instructions)

### Supported Servers

Pass the server name to the `--server` flag:

- `penpot-mcp`: Connects to `servers/penpot-mcp`
- `theme-mcp`: Connects to `servers/theme-mcp`
- `composer`: Connects to `servers/composer`

**Building Servers:**

You can either build servers manually before running the client:
```bash
npm run build --prefix servers/<server-name>
```

Or use the `--build` flag to automatically build the server before connecting:
```bash
npm run mcp:test -- --server <server-name> --build [tool-name] [args...]
```

### Examples

**List available tools:**

```bash
npm run mcp:test -- --server penpot-mcp
```

**Call a specific tool:**

```bash
npm run mcp:test -- --server penpot-mcp list_projects
```

**Call a tool with arguments:**

Arguments are passed as key-value pairs. The keys correspond to the tool's parameters.

```bash
npm run mcp:test -- --server penpot-mcp get_file --file_id "YOUR_FILE_ID"
```

**Build and run in one command:**

Use the `--build` flag to automatically build the server before running:

```bash
npm run mcp:test -- --server composer --build compose_pipeline --pipeline "design-extract" --project_path "/path/to/project"
```

**Passing JSON/Boolean/Number arguments:**

The client attempts to parse arguments as JSON. This allows passing booleans, numbers, and complex objects.

```bash
# Pass a boolean
npm run mcp:test -- --server penpot-mcp my_tool --verbose true

# Pass a number
npm run mcp:test -- --server penpot-mcp my_tool --count 42

# Pass an array (JSON syntax)
npm run mcp:test -- --server theme-mcp validate_design_data --data '{"tokens": {}}'
```

**Output Formatting:**

Control how results are displayed using the `--format` flag:

```bash
# Pretty-printed JSON (default, with syntax highlighting)
npm run mcp:test -- --server composer --format pretty compose_pipeline --pipeline "design-extract" --project_path "/path/to/project"

# Compact JSON (single line)
npm run mcp:test -- --server composer --format compact compose_pipeline --pipeline "design-extract" --project_path "/path/to/project"

# Pretty-text: Extract and render markdown content beautifully
npm run mcp:test -- --server composer --format pretty-text compose_pipeline --pipeline "design-extract" --project_path "/path/to/project"
```

**When to use each format:**
- `pretty`: Best for reading JSON results in the terminal, debugging, or when you need to inspect the structure
- `compact`: Best for piping JSON output to other tools, saving to files, or when you need minimal output
- `pretty-text`: Best for viewing markdown-formatted prompts/instructions (e.g., from `compose_pipeline`). Extracts text content and renders it with colors, proper formatting for headers, code blocks, lists, etc.

## Troubleshooting

- **Server executable not found**: Ensure you have built the server you are trying to test.
- **Unknown server**: Use one of the supported server names or provide a direct path to the server's `index.js` file.

