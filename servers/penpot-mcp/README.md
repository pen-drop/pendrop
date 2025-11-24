# Penpot MCP Server

Model Context Protocol server for extracting design data from Penpot. This is a **tool-specific extraction server** that outputs data in `pendrop.data.ds.json` format.

## Overview

The Penpot MCP server integrates with Penpot to extract design system data including components, tokens, and layout information. It transforms Penpot's native format into the standardized `pendrop.schema.ds.json` format.

## Role in Pendrop Architecture

This server is part of the **extraction layer** in Pendrop's AI-based workflow:

```
Penpot Design → penpot-mcp → pendrop.data.ds.json → theme-mcp → Generated Components
```

- **Input**: Penpot file URL or exported data
- **Output**: `pendrop.data.ds.json` (W3C DTCG compliant tokens + components)
- **Used by**: `theme-mcp` server for component and story generation

## Features

- Penpot file analysis and processing
- Component data extraction from Penpot designs
- Design token extraction in W3C DTCG format
- Automatic transformation to `pendrop.schema.ds.json` format
- Integration with Pendrop workflow via MCP
- Used by theme-mcp as extraction bridge

## Configuration

Configure Penpot credentials and API settings via environment variables. Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
# Edit .env with your Penpot credentials
```

## Development

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Start the server
npm start

# Development mode with auto-reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
npm run lint:fix
```

## Schemas

This server works with the Pendrop schemas located at `../../schemas/`:
- `pendrop.schema.content.json` - Content and configuration schema
- `pendrop.schema.ds.json` - Design system schema (W3C DTCG format)

See the main project README for more information.
