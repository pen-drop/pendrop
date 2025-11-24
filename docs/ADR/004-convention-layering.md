# ADR 004: Convention Layering

**Status:** Accepted

**Date:** 2025-11-24

## Context

Code generation needs conventions (naming styles, file structure, paths, etc.) that vary by:
1. **Target platform** (Drupal vs. WordPress vs. Laravel)
2. **Project specifics** (custom naming, different paths)
3. **Team preferences** (prefixes, organization)

We need a convention system that:
- Provides sensible defaults
- Allows platform-specific conventions
- Enables project-level overrides
- Doesn't require code changes for customization

## Decision

We implement a **three-layer convention system** with explicit merging order:

```
Built-in Conventions (lowest priority)
         ↓
Target Conventions (middle priority)
         ↓
Project Conventions (highest priority)
```

### Layer 1: Built-in Conventions

Default conventions that work for most projects.

**Location**: Embedded in MCP servers as fallbacks

**Example**:
```yaml
naming:
  style: snake_case
paths:
  components: /components
```

### Layer 2: Target Conventions

Platform-specific conventions.

**Location**: `rules/targets/{platform}/`

**Files**:
- `conventions.yaml` - Naming, paths, structure
- `prompts.yaml` - AI generation prompts
- `story.yaml` - Story format configuration

**Example** (`rules/targets/drupal/conventions.yaml`):
```yaml
naming:
  style: snake_case
  forbidden_prefixes: [node_, field_base_]
paths:
  components: /components
  config: /config/sync
drupal:
  schema_version: 1.0
  component_namespace: custom
```

### Layer 3: Project Conventions

Project-specific overrides.

**Location**: User-defined path (e.g., `my-project/rules/`)

**Files**:
- `custom-conventions.yaml`
- `custom-prompts.yaml`
- `custom-story.yaml`

**Example** (`my-project/rules/custom-conventions.yaml`):
```yaml
naming:
  component_prefix: "acme_"
paths:
  components: /web/themes/custom/acme/components
drupal:
  component_namespace: acme
```

### Merging Strategy

**Deep merge** with later layers overriding earlier ones:

```javascript
finalConventions = deepMerge(
  builtInConventions,
  targetConventions,
  projectConventions
)
```

Nested objects are merged recursively; primitives and arrays are replaced.

## Configuration

MCP servers accept configuration:

```json
{
  "target": "drupal",
  "rulesPath": "../../rules",
  "projectRules": "/path/to/my-project/rules"
}
```

If `projectRules` is null/omitted, only built-in and target conventions are used.

## Consequences

### Positive

- **Sensible defaults**: Works out-of-the-box for standard projects
- **Platform flexibility**: Each platform has its own conventions
- **Project control**: Projects can override anything
- **No code changes**: Conventions are data, not code
- **Version control**: Project conventions live in project repo
- **Validation**: Can validate conventions against schema

### Negative

- **Complexity**: Three layers to understand
- **Debugging**: Must trace through layers to understand final conventions
- **Schema maintenance**: Convention schema must be maintained

### Trade-offs

We accept the layering complexity in exchange for:
- Maximum flexibility without code changes
- Easier onboarding (sensible defaults)
- Better separation of concerns

## Use Cases

### Use Case 1: Standard Drupal Project

Just use built-in + target conventions.

```json
{
  "target": "drupal",
  "rulesPath": "../../rules",
  "projectRules": null
}
```

Gets standard Drupal conventions (snake_case, /components, etc.).

### Use Case 2: Drupal with Custom Namespace

Override component namespace.

**`my-project/rules/custom-conventions.yaml`**:
```yaml
drupal:
  component_namespace: acme
```

**Config**:
```json
{
  "target": "drupal",
  "rulesPath": "../../rules",
  "projectRules": "./my-project/rules"
}
```

### Use Case 3: Drupal with Prefixed Components

Add prefix to all component names.

**`my-project/rules/custom-conventions.yaml`**:
```yaml
naming:
  component_prefix: "acme_"
```

All generated components will have `acme_` prefix.

### Use Case 4: Custom AI Prompts

Override generation prompts for project-specific requirements.

**`my-project/rules/custom-prompts.yaml`**:
```yaml
generate_component: |
  Generate a Drupal SDC component following ACME Corp standards:
  - Always include accessibility features
  - Use BEM naming for CSS classes
  - Include RTL support
  ...
```

## Directory Structure

```
pendrop/
├── rules/
│   ├── targets/
│   │   ├── drupal/
│   │   │   ├── conventions.yaml
│   │   │   ├── prompts.yaml
│   │   │   └── story.yaml
│   │   └── wordpress/
│   │       └── ...
│   └── README.md
└── my-project/
    ├── rules/
    │   ├── custom-conventions.yaml
    │   ├── custom-prompts.yaml
    │   └── custom-story.yaml
    └── ...
```

## Validation

Conventions must validate against `schemas/pendrop.rules.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "naming": {...},
    "paths": {...},
    "structure": {...}
  }
}
```

MCP servers validate loaded conventions on startup.

## Alternatives Considered

### Alternative 1: Single Config File

One config file with everything.

**Rejected because:**
- Hard to override parts
- No separation of concerns
- Harder to version control

### Alternative 2: Code-Based Conventions

Conventions as TypeScript/JavaScript code.

**Rejected because:**
- Requires code changes for customization
- Harder for non-developers
- Can't validate easily
- Security concerns (arbitrary code execution)

### Alternative 3: No Layering

Project config completely replaces defaults.

**Rejected because:**
- Have to duplicate all conventions
- Hard to maintain
- Breaks when defaults improve

## Related Decisions

- [ADR 001: Theme MCP Bridge Pattern](001-theme-mcp-bridge-pattern.md) - How conventions are used in generation
- [ADR 002: Extraction Outputs Pendrop Format](002-extraction-outputs-pendrop-format.md) - Data format conventions apply to
- [ADR 003: Generic Story Concept](003-generic-story-concept.md) - Story conventions in story.yaml

