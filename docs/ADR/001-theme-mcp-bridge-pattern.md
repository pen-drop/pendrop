# ADR 001: Theme MCP Bridge Pattern

**Status:** Accepted

**Date:** 2025-11-24

## Context

Pendrop needs to support multiple design tools (Penpot, Figma, etc.) for extracting design system data. Each tool has its own API, data format, and extraction logic. We need a way to:

1. Support multiple design tools without code duplication
2. Provide a single entry point for AI agents
3. Route extraction requests to the appropriate tool-specific MCP server
4. Maintain clean separation between extraction and generation logic

## Decision

We implement `theme-mcp` as a **bridge/orchestrator** pattern that:

- Routes design file URLs to appropriate extraction MCPs (penpot-mcp, figma-mcp)
- Provides a single `extract_design(fileUrl)` tool that handles routing automatically
- Includes generation tools (`generate_component`, `generate_story`) that work with extracted data
- Acts as the single entry point for all design system operations

### URL Routing

The bridge detects the design tool from the URL pattern:
- `penpot.com/*` or `design.penpot.app/*` → routes to penpot-mcp
- `figma.com/*` → routes to figma-mcp
- Local files → auto-detects format

### Architecture Flow

```
AI Agent
   ↓
theme-mcp (bridge)
   ├─→ penpot-mcp → pendrop.data.ds.json
   ├─→ figma-mcp → pendrop.data.ds.json
   └─→ (future tools)
   ↓
Generate Components + Stories
```

## Consequences

### Positive

- **Single entry point**: AI agents only need to know about `theme-mcp`
- **Automatic routing**: No manual tool selection required
- **Easy extensibility**: Add new design tools without changing AI workflows
- **Clean separation**: Extraction (tool-specific) vs. Generation (tool-agnostic)
- **Reusable extraction**: Other MCP servers can use penpot-mcp, figma-mcp directly

### Negative

- **Extra layer**: Adds one more hop between AI and extraction MCPs
- **Configuration complexity**: Must configure connections to all extraction MCPs
- **Bridge maintenance**: Changes to extraction MCP interfaces require bridge updates

### Trade-offs

We accept the extra complexity of the bridge layer in exchange for:
- Better developer experience (single entry point)
- Cleaner AI workflows
- Easier maintenance when adding new design tools

## Alternatives Considered

### Alternative 1: AI Handles Routing

Let the AI agent detect the tool and call the appropriate MCP directly.

**Rejected because:**
- Duplicates routing logic in every AI workflow
- Makes AI prompts more complex
- Harder to change routing logic

### Alternative 2: Monolithic MCP

Build all extraction logic into a single MCP server.

**Rejected because:**
- Violates separation of concerns
- Makes testing harder
- Cannot reuse extraction MCPs independently

### Alternative 3: No Bridge (Direct Extraction MCPs)

Force AI to call penpot-mcp or figma-mcp directly, then separately call generation tools.

**Rejected because:**
- Splits the workflow into multiple disconnected steps
- Makes AI workflows more complex
- No single entry point for design system operations

## Related Decisions

- [ADR 002: Extraction Outputs Pendrop Format](002-extraction-outputs-pendrop-format.md) - Standardized output format
- [ADR 004: Convention Layering](004-convention-layering.md) - How conventions are loaded and merged

