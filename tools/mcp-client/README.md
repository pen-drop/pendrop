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
npm run mcp:test -- --server <server-name> [tool-name] [args...]
```

### Supported Servers

Pass the server name to the `--server` flag:

- `penpot-mcp`: Connects to `servers/penpot-mcp`
- `theme-mcp`: Connects to `servers/theme-mcp`

Make sure the target server is built before running the client (`npm run build --prefix servers/<server-name>`).

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

## Troubleshooting

- **Server executable not found**: Ensure you have built the server you are trying to test.
- **Unknown server**: Use one of the supported server names or provide a direct path to the server's `index.js` file.

