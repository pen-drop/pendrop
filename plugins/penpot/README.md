# Pendrop Penpot Plugin

Penpot plugin for mapping component data to Drupal entities. Enables configuration of entity mappings, view configurations, and component definitions directly within Penpot.

## Overview

The plugin provides a user interface within Penpot to map design components to Drupal content types, configure views, and define component properties. It works with the Pendrop schemas to generate valid configuration data.

## Features

- **Entity Type Mapping**: Map Penpot components to Drupal content types and bundles
- **Entity Field Mapping**: Map component properties to Drupal fields
- **View Configuration**: Configure Drupal views for content display
- **JSON Configuration**: Define schema for content structure and views
- **Design System Integration**: Works with W3C DTCG design tokens

## Schemas

This plugin uses the Pendrop schemas located at `../../schemas/`:
- `pendrop.schema.content.json` - Content and configuration schema
- `pendrop.schema.ds.json` - Design system schema (W3C DTCG format)

Test data files are located in `tests/` and reference these schemas.

## Development

### Prerequisites

- Node.js 20 or higher
- npm

### Setup

```bash
npm install
```

### Development Commands

```bash
# Start development server with watch mode
npm run dev

# Build for production
npm run build

# Run end-to-end tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Run all checks (type-check + lint + test:e2e)
npm run check
```

### Using the Plugin in Penpot

1. Build the plugin: `npm run build`
2. Serve the `dist/` directory (e.g., `npx serve dist`)
3. In Penpot, go to Plugins → Install Plugin
4. Enter the manifest URL: `http://localhost:3000/manifest.json` (adjust port as needed)

For development with auto-reload:
```bash
npm run dev
```
Then use `http://localhost:5176/dist/manifest.json` in Penpot.

## Testing

Tests are written using Playwright and follow the Page Object Model pattern.

```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui
```

## CI/CD

The project uses GitHub Actions for continuous integration:
- Type checking with TypeScript
- Linting with ESLint
- Running Playwright tests
- Building the plugin

See `.github/workflows/penpot-plugin-ci.yml` for details.

