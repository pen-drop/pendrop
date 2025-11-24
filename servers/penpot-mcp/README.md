# Pendrop MCP Server

Model Context Protocol server for Pendrop. Exports final combined document with structure, layout, and mapping data. Provides tools and resources to analyze and process Penpot files.

## Overview

The MCP server integrates with Penpot to extract design data and combine it with structure definitions and component mappings. It exports the final document that matches the Pendrop schemas for Drupal application generation.

## Features

- Penpot file analysis and processing
- Component data extraction
- Design token extraction (W3C DTCG format)
- Final document export combining structure, layout, and mapping data
- Integration with Pendrop workflow
- AI-powered design workflow automation via Model Context Protocol

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
