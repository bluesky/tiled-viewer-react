# GitHub Actions Test Workflow

This repository uses GitHub Actions to automatically run tests on all pull requests to the `main` branch.

## What gets tested:

### ✅ **Code Quality**
- **ESLint**: Code linting and style checks
- **TypeScript**: Type checking and compilation  
- **Build**: Production build verification

### ✅ **Test Suites**
- **TiledSearchSetup.test.tsx** - Search configuration tests
- **TiledButtonMode.test.tsx** - Button mode functionality tests
- **PreviewComponents.test.tsx** - All 6 Preview components (23 tests)
- **TiledErrorHandling.test.tsx** - Error handling tests
- **Tiled.test.tsx** - Main component integration tests

### ✅ **Environment Matrix**
- **Node.js 18.x** - LTS version
- **Node.js 20.x** - Current version

## Workflow Triggers:

- **Pull Requests** to `main` branch
- **Direct pushes** to `main` branch

## PR Comments:

The workflow automatically posts a comment on your PR with:
- ✅/❌ Overall test status
- 📊 Detailed breakdown of all test suites
- 🔧 Build and linting status
- 📝 Test environment details

## Local Testing:

Before creating a PR, run tests locally:

```bash
# Run all tests
npm run test:run

# Run specific test file
npm run test:run -- src/testing/tests/PreviewComponents.test.tsx

# Run linting
npm run lint

# Run build check
npm run build
```

## Artifacts:

Test results and coverage reports are saved as artifacts for 30 days and can be downloaded from the GitHub Actions run page.
