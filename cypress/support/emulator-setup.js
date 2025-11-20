// Connect Firebase client to emulators
export const connectToEmulators = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const { auth, db, storage } = window

    if (auth && !auth._delegate._isUsingEmulator) {
      const authEmulatorHost = Cypress.env('FIREBASE_AUTH_EMULATOR_HOST')
      if (authEmulatorHost) {
        const [host, port] = authEmulatorHost.split(':')
        cy.log(`Connecting Auth to emulator: ${host}:${port}`)

        // Connect to Auth emulator
        cy.window().then((win) => {
          const { connectAuthEmulator } = win
          if (connectAuthEmulator && win.auth) {
            connectAuthEmulator(win.auth, `http://${host}:${port}`, {
              disableWarnings: true
            })
          }
        })
      }
    }

    if (db && !db._delegate._settings.host.includes('localhost')) {
      const firestoreHost = Cypress.env('FIRESTORE_EMULATOR_HOST')
      if (firestoreHost) {
        const [host, port] = firestoreHost.split(':')
        cy.log(`Connecting Firestore to emulator: ${host}:${port}`)

        // Connect to Firestore emulator
        cy.window().then((win) => {
          const { connectFirestoreEmulator } = win
          if (connectFirestoreEmulator && win.db) {
            connectFirestoreEmulator(win.db, host, parseInt(port))
          }
        })
      }
    }

    if (storage) {
      const storageHost = Cypress.env('FIREBASE_STORAGE_EMULATOR_HOST')
      if (storageHost) {
        const [host, port] = storageHost.split(':')
        cy.log(`Connecting Storage to emulator: ${host}:${port}`)

        // Connect to Storage emulator
        cy.window().then((win) => {
          const { connectStorageEmulator } = win
          if (connectStorageEmulator && win.storage) {
            connectStorageEmulator(win.storage, host, parseInt(port))
          }
        })
      }
    }
  }
}
