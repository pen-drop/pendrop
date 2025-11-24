# AI Workflow Example

This example demonstrates the complete Pendrop AI-based workflow for design system extraction and code generation.

## Overview

The AI workflow consists of two main pipelines:

### 1. Design-System-Pipeline

```
Design Tool → Extraction → pendrop.data.ds.json → Generation → Components + Stories
```

**Steps:**
1. **Extract**: AI calls `theme-mcp.extract_design(fileUrl)`
2. **Transform**: Extraction MCP outputs `pendrop.data.ds.json`
3. **Generate Components**: AI calls `theme-mcp.generate_component()` for each component
4. **Generate Stories**: AI calls `theme-mcp.generate_story()` for each component

### 2. Content-/CMS-Pipeline

```
pendrop.data.content.json → Generation → CMS Config + Mappings
```

**Steps:**
1. **Define Structure**: Create `pendrop.data.content.json` (manually or via tools)
2. **Validate**: AI calls `schema-mcp.validate_structure()`
3. **Generate Content Types**: AI calls `schema-mcp.generate_content_types()`
4. **Generate Config**: AI calls `schema-mcp.generate_config()`

## Directory Structure

```
examples/ai-workflow/
├── pendrop.data.content.json    # Content structure (manually created)
├── pendrop.data.ds.json         # Design system (from extraction or manual)
├── rules/
│   └── custom-conventions.yaml  # Project-specific overrides
├── source/
│   └── design-file-url.txt      # Penpot/Figma URL
└── generated/
    ├── components/              # Generated SDC components
    ├── stories/                 # Generated Storybook stories
    └── config/                  # Generated Drupal config
```

## Files

### `pendrop.data.ds.json`

Design system data in W3C DTCG format. This file is:
- **Generated** by extraction MCPs (penpot-mcp, figma-mcp)
- **OR manually created** for design systems without tool integration

Contains:
- **tokens**: Design tokens (colors, spacing, typography)
- **components**: Component definitions with props
- **stories**: Story/variant definitions

### `pendrop.data.content.json`

Content structure definition. This file is:
- **Manually created** to define CMS content structure
- **OR generated** by other tools

Contains:
- **content**: Entity types, bundles, fields
- **config**: Views and other CMS configuration

### `rules/custom-conventions.yaml`

Project-specific convention overrides. Overrides base Drupal conventions with:
- Custom component prefix (`demo_`)
- Custom paths
- Custom component namespace
- Project-specific requirements

## Workflow Example

### Step 1: Extract Design System

**AI Action**: Call theme-mcp to extract design from Penpot

```javascript
// AI calls theme-mcp
{
  "tool": "extract_design",
  "params": {
    "fileUrl": "https://design.penpot.app/#/view/project-id/file-id"
  }
}

// Result: pendrop.data.ds.json is generated
```

### Step 2: Generate Components

**AI Action**: For each component in pendrop.data.ds.json, generate code

```javascript
// AI calls theme-mcp for "button" component
{
  "tool": "generate_component",
  "params": {
    "pendropDsData": { /* content of pendrop.data.ds.json */ },
    "componentId": "button",
    "target": "drupal"
  }
}

// Result: generated/components/button/
//   - component.yml
//   - template.twig
```

**Generated Files**:

`generated/components/demo_button/component.yml`:
```yaml
name: Button
description: Primary action button component
props:
  schema:
    type: object
    properties:
      variant:
        type: string
        enum: [primary, secondary]
        default: primary
      label:
        type: string
      disabled:
        type: boolean
        default: false
    required: [label]
```

`generated/components/demo_button/template.twig`:
```twig
<button class="demo-button demo-button--{{ variant }}"
        {% if disabled %}disabled{% endif %}>
  {{ label }}
</button>
```

### Step 3: Generate Stories

**AI Action**: Generate Storybook stories for components

```javascript
// AI calls theme-mcp
{
  "tool": "generate_story",
  "params": {
    "pendropDsData": { /* content of pendrop.data.ds.json */ },
    "componentId": "button",
    "target": "drupal"
  }
}

// Result: generated/stories/demo_button.stories.js
```

**Generated File**:

`generated/stories/demo_button.stories.js`:
```javascript
import { Story } from 'storybook-addon-sdc';

export default {
  title: 'Components/Button',
  component: Story,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
};

export const Primary = {
  args: {
    component: 'demo_button',
    variant: 'primary',
    label: 'Primary Button',
  },
};

export const Secondary = {
  args: {
    component: 'demo_button',
    variant: 'secondary',
    label: 'Secondary Button',
  },
};

export const Disabled = {
  args: {
    component: 'demo_button',
    variant: 'primary',
    label: 'Disabled Button',
    disabled: true,
  },
};
```

### Step 4: Generate Content Types

**AI Action**: Generate Drupal content type configuration

```javascript
// AI calls schema-mcp
{
  "tool": "generate_content_types",
  "params": {
    "pendropContentData": { /* content of pendrop.data.content.json */ },
    "target": "drupal"
  }
}

// Result: generated/config/node.type.article.yml, field configs, etc.
```

**Generated Files**:

`generated/config/node.type.article.yml`:
```yaml
langcode: en
status: true
dependencies: {}
name: Article
type: article
description: 'Content type for articles'
help: ''
new_revision: true
preview_mode: 1
display_submitted: true
```

### Step 5: Generate Views

**AI Action**: Generate Views configuration

```javascript
// AI calls schema-mcp
{
  "tool": "generate_config",
  "params": {
    "pendropContentData": { /* content of pendrop.data.content.json */ },
    "target": "drupal"
  }
}

// Result: generated/config/views.view.articles_list.yml
```

## Convention Overrides

This example uses project-specific conventions defined in `rules/custom-conventions.yaml`:

- **Component prefix**: `demo_` (overrides default of no prefix)
- **Custom paths**: `/web/themes/custom/demo/components`
- **Component namespace**: `demo`

The MCP servers merge conventions:
1. Built-in defaults
2. Drupal target conventions (`rules/targets/drupal/`)
3. Project overrides (`rules/custom-conventions.yaml`)

## Using This Example

### With MCP Servers

1. Start theme-mcp and schema-mcp servers
2. Configure AI to use the servers
3. AI follows the workflow above

### Configuration

Create `theme-mcp.config.json` and `schema-mcp.config.json` pointing to this project:

```json
{
  "target": "drupal",
  "rulesPath": "../../rules",
  "projectRules": "./examples/ai-workflow/rules"
}
```

### Manual Testing

You can also test the workflow manually by:
1. Running extraction tools directly
2. Using the generated data files
3. Testing generation tools with sample data

## Next Steps

1. **Extend**: Add more components to `pendrop.data.ds.json`
2. **Customize**: Modify `rules/custom-conventions.yaml`
3. **Generate**: Run the workflow to generate code
4. **Integrate**: Use generated code in your Drupal project

## Architecture

This example demonstrates the architecture described in:
- [ADR 001: Theme MCP Bridge Pattern](../../docs/ADR/001-theme-mcp-bridge-pattern.md)
- [ADR 002: Extraction Outputs Pendrop Format](../../docs/ADR/002-extraction-outputs-pendrop-format.md)
- [ADR 003: Generic Story Concept](../../docs/ADR/003-generic-story-concept.md)
- [ADR 004: Convention Layering](../../docs/ADR/004-convention-layering.md)

