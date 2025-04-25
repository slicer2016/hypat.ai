# Contributing to Hypat.ai

Thank you for your interest in contributing to Hypat.ai! This document provides guidelines and instructions for contributing to the project. We welcome contributions from everyone, whether you're fixing a typo, adding a feature, or suggesting an improvement.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting Guidelines](#issue-reporting-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Community](#community)

## Code of Conduct

Our project is committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to adhere to our Code of Conduct, which promotes respect, empathy, and collaboration.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git
- A Gmail account (for testing)

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hypat.ai.git
   cd hypat.ai
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```
5. Create configuration files:
   ```bash
   cp config.example.json config.development.json
   # Edit config files with your settings
   ```
6. Build the application:
   ```bash
   npm run build
   ```
7. Run database migrations:
   ```bash
   npm run db:migrate:dev
   ```
8. Run the demo to test your setup:
   ```bash
   npm run demo
   ```

## Development Workflow

1. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   Use prefixes like `feature/`, `bugfix/`, `docs/`, etc. to categorize your branches.

2. Make your changes, following the code style guidelines.

3. Write or update tests for your changes.

4. Run tests to ensure everything works:
   ```bash
   npm test
   ```

5. Ensure your code passes linting:
   ```bash
   npm run lint
   ```

6. Ensure TypeScript compilation succeeds:
   ```bash
   npm run typecheck
   ```

7. Commit your changes with meaningful commit messages:
   ```bash
   git commit -m "Add feature: descriptive message about your changes"
   ```

8. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

9. Create a pull request against the main repository's `main` branch.

## Code Style Guidelines

We follow a consistent code style to maintain readability and consistency across the codebase:

### TypeScript Guidelines

- Use TypeScript for all new code
- Include explicit type annotations for public APIs
- Avoid using `any` type when possible
- Use interfaces for defining shapes of objects
- Use enums for related constants
- Use async/await for asynchronous code

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes, interfaces, and type aliases
- Use UPPER_SNAKE_CASE for constants
- Use descriptive names that clearly indicate the purpose

### File Organization

- Group related functionality in directories
- Use index.ts files to re-export public APIs
- Keep files focused on a single responsibility
- Organize imports alphabetically and separate them into groups:
  1. External dependencies
  2. Internal modules
  3. Relative imports

### Comments and Documentation

- Use JSDoc comments for all public APIs
- Document complex logic with inline comments
- Keep comments up-to-date with code changes
- Write clear and concise commit messages

## Testing Requirements

We require tests for all new features and bug fixes. Our testing strategy includes:

### Unit Tests

- Tests for individual components and functions
- Should be isolated (use mocks when necessary)
- Should cover edge cases and failure modes
- Run with: `npm run test:unit`

### Integration Tests

- Tests for interactions between multiple components
- Tests for API endpoints and user flows
- Run with: `npm run test:integration`

### Coverage Requirements

- Aim for at least 80% test coverage for new code
- Critical paths should have 100% coverage
- Check coverage with: `npm run test:coverage`

## Pull Request Process

1. Create a pull request from your forked repository to the main repository's `main` branch.
2. Fill out the PR template completely, including:
   - Description of the changes
   - Related issue(s)
   - Type of change (bug fix, feature, etc.)
   - Testing performed
   - Screenshots (if applicable)
3. Ensure all CI checks pass:
   - Linting
   - Type checking
   - Tests
4. Address all review comments.
5. Once approved, a maintainer will merge your PR.

### PR Review Criteria

PRs are reviewed based on:
- Code quality and adherence to style guidelines
- Test coverage and quality
- Documentation completeness
- Impact on existing functionality
- Overall design and architecture considerations

## Issue Reporting Guidelines

When reporting issues, please use the provided issue templates and include:

### For Bug Reports

- A clear and descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Environment information (OS, Node.js version, etc.)
- Screenshots or logs (if applicable)
- Possible solution (if you have one)

### For Feature Requests

- A clear and descriptive title
- Detailed description of the proposed feature
- Rationale and use cases
- Any relevant mockups or examples
- Implementation ideas (if you have them)

## Documentation Guidelines

Good documentation is essential for the project:

- Update README.md when adding major features
- Document new configuration options
- Add examples for complex features
- Keep API documentation up-to-date
- Use code examples where appropriate
- Include troubleshooting information for common issues

## Community

We value community input and participation:

- Join discussions in GitHub issues
- Help others by answering questions
- Improve documentation
- Share your experience using Hypat.ai
- Provide feedback on features and roadmap

Thank you for contributing to Hypat.ai! Your efforts help make this project better for everyone.