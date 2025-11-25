# Theme MCP Rules

## Tool-Agnostic Architecture

**theme-mcp MUST be completely tool-agnostic and MUST NOT contain any Penpot-specific logic or hardcoded assumptions.**

### Rules:

1. **No Hardcoded Tool Logic**: 
   - Do NOT implement Penpot-specific data transformation logic
   - Do NOT hardcode Penpot data structures or formats
   - Do NOT assume Penpot-specific authentication flows

2. **Tool Detection Must Be Generic**:
   - Tool detection via URL patterns is acceptable (e.g., `penpot.app`, `figma.com`)
   - Tool names in type definitions are acceptable (e.g., `'penpot' | 'figma' | 'unknown'`)
   - Tool names in default configuration are acceptable (as examples)

3. **Configuration-Based**:
   - All tool-specific behavior must be configurable
   - Tool-specific extraction logic belongs in extraction packages (`rules/theme/extraction/`)
   - Tool-specific authentication belongs in extraction MCPs (e.g., `penpot-mcp`)

4. **Project Configuration**:
   - All project-specific settings come from `pendrop.yml`
   - No hardcoded project assumptions

## No Hardcoded Prompts or Instructions

**NEVER hardcode prompts, instructions, or AI prompts in the code.**

### Rules:

1. **All Instructions Must Be External**:
   - All AI prompts and instructions MUST be stored externally, never in code
   - Instructions consist of two parts:
     - **Global**: `rules/theme/extraction/instructions.yaml` (common workflow)
     - **Tool-specific**: `rules/theme/extraction/pendrop-{tool}/instructions.yaml` (MCP call details)
   - Use template variables (e.g., `{{source_tool}}`, `{{design_url}}`) for dynamic values

2. **Template-Based Approach**:
   - Load global instruction template from `rules/theme/extraction/instructions.yaml`
   - Load tool-specific extraction instructions from `pendrop-{tool}/instructions.yaml`
   - Combine both by replacing `{{tool_specific_extraction_instructions}}` placeholder in global template
   - Replace all template variables with actual values at runtime
   - Never build prompts by string concatenation in code

3. **Extraction Package Structure**:
   ```
   rules/theme/extraction/
   ├── instructions.yaml           # Global AI instruction template (YAML format)
   └── pendrop-{tool}/
       ├── instructions.yaml       # Tool-specific extraction instructions (MCP call details)
       ├── extractions.yaml        # Tool-specific extraction rules
       └── examples/               # Example input/output
   ```

4. **Instruction Structure**:
   - **Global instructions**: Contains common workflow (transform, validate, save steps)
   - **Tool-specific instructions**: Contains only the MCP extraction call details (Step 1)
   - The tool-specific part replaces `{{tool_specific_extraction_instructions}}` in global template

4. **What IS NOT Allowed**:
   - Hardcoded prompt strings in TypeScript/JavaScript code
   - String concatenation to build prompts
   - Tool-specific prompt logic in code
   - Any AI instructions embedded in source files

### Examples:

**✅ Good (Template-based):**
```typescript
// Load instruction template from extraction package
const template = await loadInstructionTemplate(extractionPackage, projectPath);
const instructions = replaceTemplateVariables(template, {
  extraction_rules: 'pendrop-penpot',
  design_url: url,
  // ...
});
```

**❌ Bad (Hardcoded):**
```typescript
// Hardcoded prompt in code
const instructions = `
# Design System Extraction Instructions
You are extracting and transforming a design file using ${extractionPackage}...
`;
```

## Reference

See main project rules: `../../CLAUDE.md`

