# Theme MCP Test Suite

Comprehensive test suite for the AI-orchestrated design system transformation workflow.

## Test Structure

```
tests/
├── fixtures/                    # Test data
│   ├── penpot-raw.json          # Raw Penpot design file
│   └── penpot-transformed.json  # Expected transformation output
├── utils/                       # Unit tests for utilities
│   ├── validator.test.ts        # Schema validation tests
│   ├── transformRules.test.ts   # Transform rules loader tests
│   └── schemaLoader.test.ts     # Schema loader tests
├── tools/                       # Unit tests for tools
│   └── transformInstructions.test.ts  # Transformation instructions tests
└── integration/                 # Integration tests
    └── workflow.test.ts         # End-to-end workflow tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx jest tests/utils/validator.test.ts
```

## Test Coverage

### Unit Tests

**Validator Tests** (`utils/validator.test.ts`)
- ✓ Validates valid design system data
- ✓ Rejects data missing required properties
- ✓ Validates W3C DTCG token format
- ✓ Validates component structure
- ✓ Validates story structure
- ✓ Provides detailed error messages
- ✓ Reports multiple errors
- ✓ Caches schemas for performance

**Transform Rules Tests** (`utils/transformRules.test.ts`)
- ✓ Loads built-in Penpot transformation rules
- ✓ Loads built-in Figma transformation rules
- ✓ Validates source matches tool
- ✓ Includes naming conventions
- ✓ Includes optional hints
- ✓ Loads example transformations
- ✓ Throws error for NPM packages (not yet supported)
- ✓ Validates transform rules structure

**Schema Loader Tests** (`utils/schemaLoader.test.ts`)
- ✓ Loads design system schema
- ✓ Loads content schema
- ✓ Returns valid JSON schema structure
- ✓ Throws error for invalid schema type
- ✓ Loads schema with all required properties

**Transform Instructions Tests** (`tools/transformInstructions.test.ts`)
- ✓ Returns comprehensive instructions
- ✓ Includes transformation rules
- ✓ References W3C DTCG format
- ✓ Includes naming conventions

### Integration Tests

**Workflow Tests** (`integration/workflow.test.ts`)
- End-to-end transformation validation
- Token extraction and validation
- Component extraction and validation
- Story generation and validation
- Data flow verification (raw → transformed)
- Component relationship preservation
- Story-component linking
- Schema compliance
- W3C DTCG token structure validation

## Test Fixtures

### Raw Penpot Data (`fixtures/penpot-raw.json`)

Realistic Penpot design file structure with:
- **Tokens page**: Color tokens, spacing tokens
- **Components page**: Button, Card components
- **Typography**: Font families, sizes, weights

Structure:
```json
{
  "pages": [
    {
      "name": "Tokens",
      "objects": [/* token objects */]
    },
    {
      "name": "Components",
      "objects": [/* component objects */]
    }
  ],
  "typography": [/* font definitions */]
}
```

### Transformed Data (`fixtures/penpot-transformed.json`)

Expected output in `pendrop.schema.ds.json` format:
- **W3C DTCG tokens**: Colors, spacing, typography
- **Components**: Button, Card with full prop definitions
- **Stories**: Multiple variants per component

## Known Issues

### Jest + ESM Configuration

Some tests currently fail due to Jest's handling of `import.meta` with Node16 module resolution:

```
SyntaxError: Cannot use 'import.meta' outside a module
```

**Status**: Known Jest limitation with hybrid ESM/CommonJS modules

**Workaround**: Tests that don't depend on `import.meta` (like `transformInstructions.test.ts`) pass successfully

**Resolution**: Will be fixed in future Jest versions or by refactoring to avoid `import.meta`

## Test Philosophy

1. **Fixtures over Mocks**: Use realistic test data (Penpot/Figma exports)
2. **Integration First**: Verify complete workflows work end-to-end
3. **Schema Validation**: All outputs must pass schema validation
4. **W3C Compliance**: Tokens must follow W3C DTCG specification
5. **Real-World Data**: Test fixtures mirror actual design tool exports

## Adding New Tests

### Unit Test Template

```typescript
import { describe, it, expect } from '@jest/globals';
import { yourFunction } from '../../src/path/to/module.js';

describe('Your Function', () => {
  it('should do something', () => {
    const result = yourFunction();
    expect(result).toBeDefined();
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect } from '@jest/globals';
import { readFile } from 'fs/promises';
import { join } from 'path';

describe('Your Workflow', () => {
  it('should complete workflow', async () => {
    const fixturePath = join(__dirname, '../fixtures/test-data.json');
    const data = JSON.parse(await readFile(fixturePath, 'utf-8'));
    
    // Test workflow
    expect(data).toBeDefined();
  });
});
```

## Future Improvements

- [ ] Fix Jest ESM configuration for full test suite
- [ ] Add tests for `generate_component` and `generate_story` tools
- [ ] Add tests for `save_design_data` tool
- [ ] Add Figma-specific test fixtures
- [ ] Add performance benchmarks
- [ ] Add visual regression tests for generated components
- [ ] Mock MCP server for testing inter-MCP communication

## Test Metrics

- **Total Tests**: 30+ test cases
- **Test Files**: 5
- **Test Coverage**: Core functionality covered
- **Passing Tests**: 5 (transformInstructions suite)
- **Build Status**: ✅ TypeScript compilation successful

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Use fixtures for realistic test data
3. Validate against schemas
4. Include integration tests for workflows
5. Update this README with new test sections

## Resources

- [Jest Documentation](https://jestjs.io/)
- [ts-jest](https://kulshekhar.github.io/ts-jest/)
- [W3C DTCG Specification](https://tr.designtokens.org/format/)
- [Pendrop Schemas](../../../schemas/)

