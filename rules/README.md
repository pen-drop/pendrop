# Pendrop Rules System

The rules system provides minimal, high-level conventions and AI prompts for code generation. The actual structure definitions come from `pendrop.data.content.json` and `pendrop.data.ds.json` files.

## Philosophy

- **Data files ARE the rules**: `pendrop.data.content.json` and `pendrop.data.ds.json` define the structure
- **Conventions guide generation**: Naming patterns, file structures, and platform-specific requirements
- **AI prompts for quality**: Templates that guide AI in generating high-quality, platform-specific code
- **Easily extensible**: Projects can override and extend conventions

## Structure

```
rules/
├── targets/              # Target platform conventions
│   └── drupal/
│       ├── conventions.yaml  # Naming, paths, structure
│       ├── prompts.yaml      # AI generation prompts
│       └── story.yaml        # Story format configuration
└── README.md
```

## Target Conventions

### Drupal

Located in `targets/drupal/`:

- **conventions.yaml**: Drupal-specific naming (snake_case), paths (/components, /config), and file structure
- **prompts.yaml**: AI prompt templates for generating SDC components, content types, views
- **story.yaml**: Storybook configuration using storybook-addon-sdc

## Extending Conventions in Your Project

Projects can extend or override conventions by providing custom rule files:

### 1. Create Project Rules Directory

```
my-project/
├── pendrop.data.content.json
├── pendrop.data.ds.json
└── rules/
    └── custom-conventions.yaml
```

### 2. Custom Conventions Example

```yaml
# my-project/rules/custom-conventions.yaml

# Override naming convention
naming:
  component_prefix: "acme_"

# Add custom paths
paths:
  components: /web/themes/custom/acme/components
  config: /config/acme

# Extend Drupal conventions
drupal:
  component_namespace: acme
  custom_field: value
```

### 3. Load Custom Conventions

When using MCP servers, specify your project rules:

```json
{
  "target": "drupal",
  "rulesPath": "../../rules",
  "projectRules": "/path/to/my-project/rules"
}
```

## Convention Merging

Conventions are merged in this order (later overrides earlier):

1. **Built-in conventions**: Default rules in this repository
2. **Target conventions**: Platform-specific rules (e.g., Drupal)
3. **Project conventions**: Your project's custom rules

## Adding New Target Platforms

To add support for a new target platform (e.g., WordPress, Laravel):

1. Create `rules/targets/{platform}/` directory
2. Add `conventions.yaml` with platform-specific conventions
3. Add `prompts.yaml` with AI generation prompts
4. Add `story.yaml` if applicable
5. Document in this README

### Example: Adding WordPress

```bash
mkdir -p rules/targets/wordpress
```

```yaml
# rules/targets/wordpress/conventions.yaml
naming:
  style: kebab-case
  component_prefix: "wp-"

paths:
  components: /wp-content/themes/custom/components
  
structure:
  component_files:
    - component.json
    - template.php
```

## Rules Schema

All convention files must validate against `schemas/pendrop.rules.json`.

This ensures consistency and enables tooling support (validation, autocomplete).

