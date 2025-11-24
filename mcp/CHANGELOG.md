# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2024-11-15

### Added
- Initial Node.js/TypeScript port of penpot-mcp from Python
- Full MCP protocol implementation with @modelcontextprotocol/sdk
- Penpot API client with Transit+JSON support
- Cookie-based authentication with automatic re-authentication
- Memory cache for file data (10-minute TTL)
- HTTP server for serving exported images
- Object tree utilities for analyzing Penpot file structures
- CloudFlare error detection and handling

### Features
- `list_projects` - List all Penpot projects
- `get_project_files` - Get files for a specific project
- `get_file` - Retrieve and cache Penpot files
- `export_object` - Export design objects as images
- `get_object_tree` - Get filtered object tree with screenshots
- `search_object` - Search objects by name (regex support)

### Resources
- `server://info` - Server status and information
- `penpot://schema` - Penpot API schema
- `penpot://tree-schema` - Penpot object tree schema
- `penpot://cached-files` - List of cached files
- `rendered-component://{id}` - Rendered component images

### Development
- TypeScript with strict mode enabled
- ESLint configuration for code quality
- Jest configuration for testing
- Comprehensive README with setup instructions

