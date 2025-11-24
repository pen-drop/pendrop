# Pendrop

Pendrop automates the creation of Drupal applications based on structure data and layout data from Penpot. Based on a uniform structure file, everything else is generated, tested, and updated via rule sets.

## Overview

Pendrop generates Drupal applications from Penpot designs. It combines structure definitions, layout information, and component mappings to create complete Drupal implementations with automated test data and Storybook integration.

## How It Works

1. **Structure Definition**: Defines Drupal requirements including content types, views, and configuration
2. **Layout Enhancement**: Penpot adds layout information including components, variants, slots, props, and Storybook stories
3. **Mapping**: Penpot plugin maps Penpot components to Drupal entities
4. **Test Data**: Auto-generated test data in separate JSON files following Drupal Default Content Import format for review
5. **Final Document**: MCP server exports combined structure, layout, and mapping data matching the schema
6. **Storybook Integration**: Component stories map to Storybook stories for component documentation

## Architecture

**Penpot Plugin**: Penpot plugin for mapping component data to Drupal entities. Enables configuration of entity mappings, view configurations, and component definitions.

**MCP Server**: Exports final combined document with structure, layout, and mapping data. Provides tools and resources to analyze and process Penpot files.

## Installation

- Node.js (version 18 or higher)
- Python 3.10 or higher (for MCP Server)
- Penpot instance for plugin integration

## License

[Add license information here]

## Contributing

Contributions are welcome! Please create an issue or pull request for improvements.
