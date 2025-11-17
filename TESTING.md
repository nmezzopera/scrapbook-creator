# Testing Guide - Scrapbook Creator

## Overview

This project uses **Cypress** for end-to-end (E2E) testing. Cypress provides a complete testing solution with visual debugging, automatic waiting, and real-time reloading.

## Prerequisites

- Node.js 18+ installed
- Firebase project configured
- Application running locally (`npm run dev`)

## Installation

Cypress and testing dependencies are already installed. If you need to reinstall:

```bash
npm install -D cypress cypress-firebase
```

## Running Tests

### Interactive Mode (Recommended for Development)

Opens the Cypress Test Runner with a UI:

```bash
npm run test:open
```

This allows you to:
- Select which tests to run
- See tests execute in real-time
- Debug tests visually
- Use time-travel debugging

### Headless Mode (CI/Production)

Runs all tests in the terminal without a UI:

```bash
npm test
```

### Browser-Specific Tests

Run tests in specific browsers:

```bash
# Chrome
npm run test:chrome

# Firefox
npm run test:firefox

# Headed mode (see browser window)
npm run test:headed
```

## Test Structure

```
cypress/
├── e2e/                    # E2E test files
│   ├── auth.cy.js         # Authentication tests
│   ├── scrapbook.cy.js    # Scrapbook CRUD tests
│   └── pdf-export.cy.js   # PDF generation tests
├── fixtures/               # Test data
│   └── test-data.json     # Sample test data
└── support/               # Support files
    ├── commands.js        # Custom commands
    └── e2e.js            # Global configuration
```

## Available Tests

### 1. Authentication Tests (`auth.cy.js`)

Tests user authentication flow:
- ✅ Landing page display
- ✅ Login redirection
- ✅ Sign-in button visibility
- ⏭️ Google sign-in (requires test credentials)

### 2. Scrapbook Tests (`scrapbook.cy.js`)

Tests scrapbook functionality:
- ✅ Section creation (regular, title, timeline)
- ✅ Section editing (title, description)
- ✅ Section management (reorder, delete)
- ✅ Auto-save functionality
- ✅ Sync status indicators

### 3. PDF Export Tests (`pdf-export.cy.js`)

Tests PDF generation (critical flow):
- ✅ Export button visibility and state
- ✅ Loading indicators during generation
- ✅ Successful PDF generation
- ✅ Progress message display
- ✅ Multiple section type exports
- ✅ Error handling
- ✅ Performance benchmarks

## Custom Commands

Located in `cypress/support/commands.js`:

### Authentication
```javascript
cy.login()          // Login with test account
cy.logout()         // Logout from app
```

### Scrapbook Operations
```javascript
cy.createSection('regular')    // Create section
cy.createSection('title')      // Create title page
cy.createSection('timeline')   // Create timeline

cy.deleteSection(0)            // Delete section by index
cy.addTextToSection(0, 'text') // Add text to section
```

### PDF Export
```javascript
cy.waitForPdfExport()          // Wait for PDF completion
cy.waitForPdfExport(180000)    // Custom timeout
```

### Utilities
```javascript
cy.elementExists('.selector')  // Check if element exists
```

## Test Configuration

Configuration is in `cypress.config.js`:

```javascript
{
  baseUrl: 'http://localhost:5173',
  defaultCommandTimeout: 10000,
  requestTimeout: 120000,      // 2 min for PDF generation
  responseTimeout: 120000,
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,                // Set to true for CI
  screenshotOnRunFailure: true
}
```

## Writing New Tests

### Basic Test Structure

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait(2000) // Wait for auth state
  })

  it('should do something', () => {
    // Arrange
    cy.createSection('regular')

    // Act
    cy.get('[data-section-id]').first().click()

    // Assert
    cy.get('[data-section-id]').should('be.visible')
  })
})
```

### Best Practices

1. **Use data attributes for selection**:
   ```javascript
   // Good
   cy.get('[data-testid="export-btn"]')

   // Avoid
   cy.get('.btn-primary')
   ```

2. **Wait for elements properly**:
   ```javascript
   cy.contains('PDF created', { timeout: 120000 })
   ```

3. **Clean up after tests**:
   ```javascript
   afterEach(() => {
     // Clean up test data
   })
   ```

4. **Use custom commands**:
   ```javascript
   // Instead of repeating code
   cy.login()
   cy.createSection('title')
   ```

## Testing with Firebase

### Using Firebase Emulators (Recommended)

1. **Install Firebase emulators**:
   ```bash
   firebase init emulators
   ```

2. **Start emulators**:
   ```bash
   firebase emulators:start
   ```

3. **Update `cypress.config.js`**:
   ```javascript
   env: {
     FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
     FIRESTORE_EMULATOR_HOST: 'localhost:8080',
     FIREBASE_STORAGE_EMULATOR_HOST: 'localhost:9199',
   }
   ```

4. **Run tests against emulators**:
   ```bash
   npm run test:open
   ```

### Using Production Firebase (Current Setup)

Tests currently run against production Firebase. To use test accounts:

1. Create a test user in Firebase Console
2. Use `cypress-firebase` for authentication:
   ```javascript
   cy.login('test@example.com', 'password')
   ```

## Debugging Tests

### Visual Debugging

1. Open Cypress Test Runner: `npm run test:open`
2. Click on a test to run it
3. Use time-travel debugging (hover over commands)
4. View DOM snapshots at each step

### Console Logs

Add debug logs in tests:
```javascript
cy.log('Debug message')
cy.get('.element').then(($el) => {
  console.log($el)
})
```

### Screenshots

Automatically captured on test failure in `cypress/screenshots/`

### Videos

Enable in `cypress.config.js`:
```javascript
video: true
```

Videos saved to `cypress/videos/`

## Continuous Integration (Future)

When ready to add CI:

1. **GitHub Actions** example:
   ```yaml
   - name: Run Cypress tests
     run: npm test
   - name: Upload screenshots
     uses: actions/upload-artifact@v3
     if: failure()
     with:
       name: cypress-screenshots
       path: cypress/screenshots
   ```

2. **Cypress Dashboard** (optional):
   - Sign up at https://dashboard.cypress.io
   - Get project key
   - Run: `cypress run --record --key <key>`

## Known Issues & Workarounds

### Google Sign-In in Tests

Google OAuth requires manual interaction. Solutions:

1. **Use Firebase emulators** with mock users
2. **Use cypress-firebase** with service account
3. **Skip auth tests** and test with pre-authenticated state

Current: Tests are skipped for Google sign-in

### PDF Export Timeouts

PDF generation can take 1-2 minutes for large scrapbooks:
- Increase timeout: `{ timeout: 180000 }`
- Tests are configured with 2-minute timeouts

### Image Upload Tests

Currently skipped. To enable:
1. Add test images to `cypress/fixtures/`
2. Use `cy.fixture()` and `attachFile()`

## Performance Benchmarks

Expected test execution times:

- **Auth tests**: ~5 seconds
- **Scrapbook tests**: ~30 seconds
- **PDF export tests**: ~2-3 minutes (due to generation time)
- **Full suite**: ~5 minutes

## Troubleshooting

### "baseUrl" not accessible

**Solution**: Ensure dev server is running:
```bash
npm run dev
```

### Tests timing out

**Solution**: Increase timeout in test or config:
```javascript
cy.get('.element', { timeout: 30000 })
```

### Firebase auth errors

**Solution**: Check Firebase credentials and project configuration

### PDF tests failing

**Solution**:
1. Check Cloud Function logs: `firebase functions:log`
2. Verify IAM permissions are set
3. Check Storage lifecycle policy
4. Ensure emulators are running (if using them)

## Resources

- [Cypress Documentation](https://docs.cypress.io)
- [cypress-firebase Plugin](https://github.com/prescottprue/cypress-firebase)
- [Firebase Testing Guide](https://firebase.google.com/docs/rules/unit-tests)
- [Testing Best Practices](https://docs.cypress.io/guides/references/best-practices)

## Contributing

When adding new features:

1. ✅ Write tests first (TDD)
2. ✅ Add custom commands for reusable actions
3. ✅ Update this documentation
4. ✅ Ensure tests pass before submitting PR

## Support

For issues or questions:
- Check Cypress logs in terminal
- Review screenshots in `cypress/screenshots/`
- Open an issue in the repository
