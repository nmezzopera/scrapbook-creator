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
      // Initialize Firebase Admin for emulators (no credentials needed)
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: config.env.FIREBASE_PROJECT_ID,
        })
      }

      // Set environment variables for Firebase Admin to use emulators
      process.env.FIRESTORE_EMULATOR_HOST = config.env.FIRESTORE_EMULATOR_HOST
      process.env.FIREBASE_AUTH_EMULATOR_HOST = config.env.FIREBASE_AUTH_EMULATOR_HOST
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = config.env.FIREBASE_STORAGE_EMULATOR_HOST

      // Add custom task for creating auth tokens
      on('task', {
        createCustomToken({ uid, email, displayName }) {
          // Create custom token for test user
          return admin.auth().createCustomToken(uid, {
            email,
            displayName
          })
        }
      })

      // Initialize Firebase Admin for testing with cypress-firebase
      return cypressFirebasePlugin(on, config, admin)
    },
  },

  env: {
    // Firebase project config
    FIREBASE_PROJECT_ID: 'relationship-scrapbook',

    // Use Firebase emulators for testing
    FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
    FIRESTORE_EMULATOR_HOST: 'localhost:8080',
    FIREBASE_STORAGE_EMULATOR_HOST: 'localhost:9199',

    // Test user credentials
    TEST_UID: 'test-user-123',
    TEST_EMAIL: 'test@scrapbook.com',
    TEST_DISPLAY_NAME: 'Test User',
  },
})
