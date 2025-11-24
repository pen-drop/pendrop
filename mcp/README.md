# Pendrop MCP Server

Model Context Protocol server for Pendrop. Exports final combined document with structure, layout, and mapping data. Provides tools and resources to analyze and process Penpot files.

## Overview

The MCP server integrates with Penpot to extract design data and combine it with structure definitions and component mappings. It exports the final document that matches the Pendrop schema for Drupal application generation.

## Features

- Penpot file analysis and processing
- Component data extraction
- Final document export combining structure, layout, and mapping data
- Integration with Pendrop workflow

## Configuration

Configure Penpot credentials and API settings via environment variables.

## Development

```bash
npm install
npm run build
npm start
```

## Testing

```bash
npm test
```
