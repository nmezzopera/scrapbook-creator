const { defineConfig } = require('cypress')
const admin = require('firebase-admin')
const { plugin: cypressFirebasePlugin } = require('cypress-firebase')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,

    // Increase timeouts for PDF generation tests
    defaultCommandTimeout: 10000,
    requestTimeout: 120000, // 2 minutes for PDF generation
    responseTimeout: 120000,

    setupNodeEvents(on, config) {
      // Initialize Firebase Admin for testing
      return cypressFirebasePlugin(on, config, admin, {
        // Use Firebase emulators for testing
        credential: admin.credential.applicationDefault(),
      })
    },
  },

  env: {
    // Firebase project config
    FIREBASE_PROJECT_ID: 'relationship-scrapbook',

    // Use emulators for testing (optional - uncomment when using emulators)
    // FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
    // FIRESTORE_EMULATOR_HOST: 'localhost:8080',
    // FIREBASE_STORAGE_EMULATOR_HOST: 'localhost:9199',
  },
})
