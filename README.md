# Pendrop

Automates the creation of Drupal applications from Penpot designs through structure data and layout data.

## Concept

Pendrop bridges design and development by generating Drupal applications from Penpot designs. It uses a uniform structure file as the foundation, from which everything else is generated, tested, and updated via rule sets.

### Workflow

1. Define Drupal content structure using JSON schemas
2. Design components and layouts in Penpot
3. Map Penpot components to Drupal entities via plugin
4. Export combined data through MCP server
5. Generate Drupal application with test data and Storybook integration

### Components

- **Schemas**: Define content structure and design system (W3C DTCG tokens)
- **Penpot Plugin**: Map design components to Drupal entities
- **MCP Server**: Process Penpot files and export combined data

## Project Structure

```
schemas/     # JSON schemas for content and design system
examples/    # Example data files
plugins/     # Penpot plugin for entity mapping
servers/     # MCP server for Penpot processing
```

## License

MIT
