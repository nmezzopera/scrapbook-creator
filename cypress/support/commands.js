// Custom Cypress commands for Scrapbook Creator

/**
 * Login with Google (using cypress-firebase)
 * @example cy.login()
 */
Cypress.Commands.add('login', () => {
  // Use cypress-firebase login command
  // This will authenticate with Firebase using a test account
  cy.log('Logging in with test account')

  // For now, we'll visit the app and let the user authenticate manually
  // In production, you'd use cy.login() from cypress-firebase with a test account
  cy.visit('/')

  // Wait for auth state to resolve
  cy.wait(2000)
})

/**
 * Logout from the application
 * @example cy.logout()
 */
Cypress.Commands.add('logout', () => {
  cy.log('Logging out')
  cy.get('[data-testid="user-menu"]').click()
  cy.contains('Logout').click()
  cy.wait(1000)
})

/**
 * Create a new section in the scrapbook
 * @param {string} type - Section type: 'regular', 'title', or 'timeline'
 * @example cy.createSection('title')
 */
Cypress.Commands.add('createSection', (type = 'regular') => {
  cy.log(`Creating ${type} section`)

  if (type === 'title') {
    cy.contains('Add Title Page').click()
  } else if (type === 'timeline') {
    cy.contains('Add Timeline').click()
  } else {
    cy.contains('Add Section').click()
  }

  cy.wait(500)
})

/**
 * Delete a section by index
 * @param {number} index - Section index (0-based)
 * @example cy.deleteSection(0)
 */
Cypress.Commands.add('deleteSection', (index) => {
  cy.log(`Deleting section at index ${index}`)
  cy.get('[data-section-id]').eq(index).within(() => {
    cy.get('[data-testid="delete-section"]').click()
  })
  cy.contains('Yes, delete it').click()
  cy.wait(500)
})

/**
 * Add text to a section
 * @param {number} sectionIndex - Section index
 * @param {string} text - Text content
 * @example cy.addTextToSection(0, 'Our love story begins...')
 */
Cypress.Commands.add('addTextToSection', (sectionIndex, text) => {
  cy.log(`Adding text to section ${sectionIndex}`)
  cy.get('[data-section-id]').eq(sectionIndex).within(() => {
    cy.get('[contenteditable="true"]').first().type(text)
  })
  cy.wait(500)
})

/**
 * Wait for PDF export to complete
 * @param {number} timeout - Timeout in milliseconds (default: 120000)
 * @example cy.waitForPdfExport()
 */
Cypress.Commands.add('waitForPdfExport', (timeout = 120000) => {
  cy.log('Waiting for PDF export to complete')
  cy.contains('PDF created successfully!', { timeout }).should('be.visible')
})

/**
 * Check if element exists without failing the test
 * @param {string} selector - Element selector
 * @example cy.elementExists('.my-element')
 */
Cypress.Commands.add('elementExists', (selector) => {
  cy.get('body').then(($body) => {
    return $body.find(selector).length > 0
  })
})
