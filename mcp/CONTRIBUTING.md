# Contributing to Penpot MCP Node

Thank you for your interest in contributing to Penpot MCP Node! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/penpot-mcp-node.git
   cd penpot-mcp-node
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/my-new-feature
   ```

## Development Workflow

### Building the Project

```bash
npm run build
```

### Running in Development Mode

```bash
npm run dev
```

### Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint)
- Write meaningful commit messages
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Submitting Changes

1. **Commit your changes** with a clear message:
   ```bash
   git commit -m "Add feature: description of what you added"
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/my-new-feature
   ```

3. **Open a Pull Request** on GitHub with:
   - Clear description of the changes
   - Reference to any related issues
   - Screenshots if applicable (for UI changes)

## Reporting Issues

When reporting issues, please include:
- Node.js version
- Operating system
- Steps to reproduce the issue
- Expected vs actual behavior
- Error messages or logs

## Feature Requests

We welcome feature requests! Please:
- Check if the feature has already been requested
- Provide a clear use case for the feature
- Explain how it would benefit users

## Questions?

If you have questions, feel free to:
- Open an issue with the "question" label
- Reach out to the maintainers

Thank you for contributing! 🎉

