# ADR 002: Extraction Outputs Pendrop Format

**Status:** Accepted

**Date:** 2025-11-24

## Context

Design tool extraction MCPs (penpot-mcp, figma-mcp) need to output data that can be consumed by generation tools. We need to decide:

1. What format should extraction MCPs output?
2. Should they output raw tool data or transformed data?
3. Who is responsible for extraction: extraction MCP or generation MCP?

The key insight is that `pendrop.data.ds.json` and `pendrop.data.content.json` ARE the rules for generation. These files define the structure that generation tools expect.

## Decision

**Extraction MCPs output data in `pendrop.schema.ds.json` format directly.**

Each tool-specific extraction MCP (penpot-mcp, figma-mcp) is responsible for:
- Extracting data from the design tool
- Transforming it to `pendrop.schema.ds.json` format
- Outputting W3C DTCG-compliant tokens
- Structuring components according to pendrop schema

The output is `pendrop.data.ds.json` - a valid instance of `pendrop.schema.ds.json`.

### Why This Format?

`pendrop.data.ds.json` is not just data—it IS the rules. Generation tools use this file as:
- **Structure definition**: What components exist and their properties
- **Token definition**: Design tokens in W3C DTCG format
- **Component relationships**: How components relate to each other
- **Generation input**: Direct input for code generation

## Consequences

### Positive

- **Single source of truth**: `pendrop.data.ds.json` is both rules and data
- **Tool-agnostic generation**: Generation tools don't need to know about Penpot/Figma
- **Standard format**: W3C DTCG compliance ensures interoperability
- **Validation**: Can validate extraction output against schema
- **Reusable**: Same format for manual creation or tool extraction

### Negative

- **Extraction complexity**: Each extraction MCP must implement extraction
- **Schema coupling**: Extraction MCPs depend on pendrop schema
- **Update coordination**: Schema changes require updating all extraction MCPs

### Trade-offs

We accept the extraction complexity in exchange for:
- Clean separation of concerns (extraction vs. generation)
- Ability to manually create `pendrop.data.ds.json` without extraction tools
- Tool-agnostic generation pipeline

## Data Flow

```
Penpot Design → penpot-mcp → pendrop.data.ds.json → theme-mcp → Components
Figma Design → figma-mcp → pendrop.data.ds.json → theme-mcp → Components
Manual Creation → pendrop.data.ds.json → theme-mcp → Components
```

All paths converge at `pendrop.data.ds.json` format.

## Alternatives Considered

### Alternative 1: Raw Tool Format

Extraction MCPs output raw tool data (Penpot format, Figma format), and generation tools transform it.

**Rejected because:**
- Generation tools would need to know about every tool's format
- Violates tool-agnostic principle
- Cannot manually create design system data without a tool

### Alternative 2: Separate Transformer MCPs

Have dedicated transformer MCPs: penpot-mcp outputs raw data, penpot-transformer-mcp transforms to pendrop format.

**Rejected because:**
- Adds unnecessary complexity
- Splits related logic across multiple servers
- AI workflows become more complex

### Alternative 3: Generic Schema

Define a completely generic, tool-agnostic schema that supports all possible design tool features.

**Rejected because:**
- Too abstract and complex
- Harder to generate code from
- W3C DTCG already provides a good foundation

## Schema Format

We use W3C Design Tokens Community Group (DTCG) specification for tokens:

```json
{
  "$schema": "../../schemas/pendrop.schema.ds.json",
  "tokens": {
    "color": {
      "primary": {
        "$value": "#007bff",
        "$type": "color",
        "$description": "Primary brand color"
      }
    }
  },
  "components": {
    "button": {
      "props": {...},
      "tokens": ["color.primary"]
    }
  },
  "stories": {...}
}
```

## Related Decisions

- [ADR 001: Theme MCP Bridge Pattern](001-theme-mcp-bridge-pattern.md) - How extraction is routed
- [ADR 003: Generic Story Concept](003-generic-story-concept.md) - Story structure in output

