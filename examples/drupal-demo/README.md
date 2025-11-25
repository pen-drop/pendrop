# Pendrop Drupal 11 Demo

Real Drupal 11 project demonstrating AI-powered component generation with Pendrop.

## Overview

This is a complete Drupal 11 project that uses Pendrop's AI-based workflow to:
- Extract design system data from Penpot or Figma
- Generate Drupal Single Directory Components (SDC)
- Create Storybook stories for component documentation
- Generate Drupal content type configurations

## Project Structure

```
drupal-demo/
├── composer.json                    # Drupal 11 dependencies
├── pendrop.yml                      # Pendrop configuration
├── .pendrop/
│   └── dist/
│       └── pendrop.data.ds.json     # Extracted design system data
├── web/
│   └── themes/
│       └── custom/
│           └── pendrop/
│               ├── pendrop.info.yml
│               ├── components/      # Generated SDC components
│               ├── stories/         # Generated Storybook stories
│               └── .storybook/      # Storybook configuration
├── config/
│   └── sync/                        # Generated Drupal config
└── design/
    ├── pendrop.data.content.json    # Content structure definition
    └── rules/                       # Custom conventions (optional)
        └── custom-conventions.yaml
```

## Setup

### 1. Install Drupal Dependencies

```bash
composer install
```

### 2. Configure Pendrop

Edit `pendrop.yml` and configure:
- Your design tool credentials (Penpot or Figma)
- Design file URL
- Project settings

```yaml
project:
  type: drupal
  name: pendrop-demo
  theme: pendrop

design:
  url: https://design.penpot.app/#/view/your-project/your-file
  auth:
    penpot:
      username: your-email@example.com
      password: your-password
```

**Security Note**: Add `pendrop.yml` to `.gitignore` if it contains credentials, or use environment variables.

### 3. Run AI Workflow

#### Extract Design System

Use AI to call theme-mcp and extract design data:

```javascript
// AI calls theme-mcp
extract_design({ 
  fileUrl: "https://design.penpot.app/..." 
})

// Output: .pendrop/dist/pendrop.data.ds.json
```

#### Generate Components

AI generates SDC components from extracted data:

```javascript
// For each component in pendrop.data.ds.json
generate_component({
  pendropDsData: { /* from .pendrop/dist/ */ },
  componentId: "button",
  target: "drupal"
})

// Output: web/themes/custom/pendrop/components/button/
//   - component.yml
//   - template.twig
```

#### Generate Stories

AI generates Storybook stories:

```javascript
generate_story({
  pendropDsData: { /* from .pendrop/dist/ */ },
  componentId: "button",
  target: "drupal"
})

// Output: web/themes/custom/pendrop/stories/button.stories.js
```

#### Generate Drupal Config

AI generates content types and views:

```javascript
// Using design/pendrop.data.content.json
generate_content_types({
  pendropContentData: { /* from design/ */ },
  target: "drupal"
})

// Output: config/sync/*.yml
```

### 4. Install Drupal

```bash
# Create database and update settings
cp web/sites/default/default.settings.php web/sites/default/settings.php

# Install Drupal
vendor/bin/drush site:install --db-url=mysql://user:pass@localhost/dbname

# Import generated configuration
vendor/bin/drush config:import
```

### 5. Run Storybook

```bash
cd web/themes/custom/pendrop
npm install
npm run storybook
```

Visit http://localhost:6006 to see your components.

## Configuration

### pendrop.yml

Main configuration file. See comments in the file for all options.

**Key settings:**
- `project.type`: Target platform (drupal, wordpress, etc.)
- `project.theme`: Theme name (used in path resolution)
- `design.url`: Design file URL(s)
- `design.auth`: Authentication credentials
- `rules.custom_rules_path`: Optional custom rules directory

### Paths

Paths are automatically determined by `rules/theme/targets/drupal/conventions.yaml` based on your `project.type`.

You can override paths in `design/rules/custom-conventions.yaml` if needed.

### Custom Rules

Place custom convention overrides in `design/rules/custom-conventions.yaml`:

```yaml
naming:
  component_prefix: "acme_"

drupal:
  component_namespace: acme
```

## Development Workflow

1. **Design in Penpot/Figma**: Create your design system
2. **Configure**: Update `pendrop.yml` with design URL
3. **Extract**: AI extracts design data to `.pendrop/dist/`
4. **Generate**: AI generates components, stories, and config
5. **Test**: Review components in Storybook
6. **Deploy**: Use generated Drupal configuration

## MCP Servers

Pendrop uses Model Context Protocol (MCP) servers for AI-powered generation:

- **theme-mcp**: Design system extraction and component generation
- **schema-mcp**: Content structure and CMS configuration generation

See main Pendrop documentation for MCP server setup.

## File Locations

### Generated Files

- Components: `web/themes/custom/pendrop/components/`
- Stories: `web/themes/custom/pendrop/stories/`
- Config: `config/sync/`
- Design Data: `.pendrop/dist/pendrop.data.ds.json`

### Source Files

- Content Structure: `design/pendrop.data.content.json`
- Custom Rules: `design/rules/custom-conventions.yaml`

### Gitignore

Add to `.gitignore`:
```
# Generated files
/.pendrop/dist/
/web/themes/custom/*/components/
/web/themes/custom/*/stories/
/config/sync/*.yml

# Drupal
/vendor/
/web/core/
/web/modules/contrib/
/web/themes/contrib/

# Sensitive
/pendrop.yml
```

## Architecture

This project demonstrates:
- **Design-System-Pipeline**: Penpot/Figma → Extract → Components + Stories
- **Content-/CMS-Pipeline**: Content Structure → Drupal Config

See main Pendrop documentation:
- [Architecture Overview](../../docs/ARCHITECTURE.md)
- [ADRs](../../docs/ADR/)

## Support

- **Issues**: https://github.com/pen-drop/pendrop/issues
- **Discussions**: https://github.com/pen-drop/pendrop/discussions
- **Documentation**: https://github.com/pen-drop/pendrop

## License

MIT

