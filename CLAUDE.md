# Claude AI Rules for Pendrop Project

## Subproject Rules

**Additional rules specific to subprojects are located in their respective directories:**

- **Penpot Plugin**: See `plugins/penpot/CLAUDE.md` for Vue.js, FormKit, and plugin-specific rules
- **Theme MCP**: See `servers/theme-mcp/CLAUDE.md` for tool-agnostic architecture and no-hardcoded-prompts rules

## Git Branching

**Main branch is `1.x`:**

- The primary development branch is `1.x` (not `main` or `master`)
- All feature branches should be based on `1.x`
- Pull requests should target `1.x`
- CI/CD workflows target `1.x` as the main branch


## GitHub Actions

**npm cache configuration:**

- Do NOT use `cache: 'npm'` with `cache-dependency-path` in GitHub Actions workflows
- The cache can fail if the path is not correctly resolved relative to the repository root
- Let GitHub Actions handle caching automatically or omit it entirely
- Use `npm ci` for clean, reproducible installations without cache issues

Example:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'
    # NO cache configuration

- name: Install dependencies
  working-directory: servers/theme-mcp
  run: npm ci
```

## Language Rule

**All project documentation, code comments, commit messages, and communication must be in English.**

This includes:
- README files
- Documentation
- Code comments
- Commit messages
- Variable names (use English)
- Function names (use English)
- API documentation
- Error messages
- User-facing text

Exceptions:
- Only when explicitly required by external APIs or third-party integrations that mandate a specific language
- Test data that requires specific language examples for testing purposes

## README Guidelines

**All README files must follow these rules:**

- **Be concise**: Keep READMEs brief and focused on essential information
- **No file/folder references**: Do not include references to specific files or folder structures
- **English only**: All READMEs must be written in English

## JavaScript/TypeScript Development Rules

**Always use ECMAScript Modules (ESM):**

- All TypeScript/JavaScript projects must use `"type": "module"` in `package.json`
- Use ESM import/export syntax (not CommonJS `require`/`module.exports`)
- Use `.js` extensions in import statements for TypeScript files
- TypeScript config must use `"module": "Node16"` or `"NodeNext"` with `"moduleResolution": "Node16"` or `"NodeNext"`

**Testing Framework:**

- **Always use Vitest** (not Jest) for all test suites
- Vitest has native ESM and TypeScript support without experimental flags
- Test files should use `.test.ts` extension
- Import test functions from `vitest`: `import { describe, it, expect, vi } from 'vitest'`
- Use `vitest.config.ts` for configuration
- For mocking, use `vi.mock()` instead of `jest.mock()`

**Package.json Scripts:**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

**Required Dependencies for Testing:**

- `vitest` - Test framework
- `@vitest/ui` - Optional UI for test runner
- `@vitest/coverage-v8` - Code coverage

## Project Context

Pendrop automates the creation of Drupal applications based on structure data and layout data from Penpot. Based on a uniform structure file, everything else is generated, tested, and updated via rule sets.

