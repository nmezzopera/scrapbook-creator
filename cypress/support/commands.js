// Custom Cypress commands for Scrapbook Creator

/**
 * Login with test user (using Firebase Auth emulator)
 * @example cy.login()
 */
Cypress.Commands.add('login', () => {
  const testUid = Cypress.env('TEST_UID')
  const testEmail = Cypress.env('TEST_EMAIL')
  const testDisplayName = Cypress.env('TEST_DISPLAY_NAME')

  cy.log(`Logging in as ${testEmail}`)

  // Create custom token
  cy.task('createCustomToken', {
    uid: testUid,
    email: testEmail,
    displayName: testDisplayName
  }).then((token) => {
    // Visit the page first
    cy.visit('/')

    // Then sign in with the custom token
    cy.window().its('signInWithCustomToken').then((signInFn) => {
      return signInFn(token)
    })
  })

  // Wait for auth state by checking for authenticated UI elements
  cy.url().should('include', '/scrapbook')
  cy.contains('Our Love Story').should('be.visible')
})

/**
 * Clear all sections from the scrapbook
 * @example cy.clearAllSections()
 */
Cypress.Commands.add('clearAllSections', () => {
  cy.log('Clearing all sections')

  cy.get('body').then($body => {
    const deleteAll = () => {
      if ($body.find('[data-section-id]').length > 0) {
        cy.get('[data-section-id]').first().within(() => {
          cy.get('button[aria-label*="delete"], button[title*="Delete"]').first().click()
        })
        cy.contains('Yes, delete it').click()
        cy.get('body').then($newBody => {
          deleteAll()
        })
      }
    }
    deleteAll()
  })
})

/**
 * Logout from the application
 * @example cy.logout()
 */
Cypress.Commands.add('logout', () => {
  cy.log('Logging out')
  cy.get('[data-testid="user-menu"]').click()
  cy.contains('Logout').click()
  // Wait for redirect to login page
  cy.url().should('include', '/login')
})

/**
 * Create a new section in the scrapbook
 * @param {string} type - Section type: 'regular', 'title', or 'timeline'
 * @example cy.createSection('title')
 */
Cypress.Commands.add('createSection', (type = 'regular') => {
  cy.log(`Creating ${type} section`)

  // Determine button text
  let buttonText
  if (type === 'title') {
    buttonText = 'Add Title Page'
  } else if (type === 'timeline') {
    buttonText = 'Add Timeline'
  } else {
    buttonText = 'Add Regular Page'
  }

  // Wait for the page to be fully loaded by checking for the button
  cy.contains('button', buttonText).should('be.visible')

  // Get initial section count (may be 0)
  cy.get('body').then($body => {
    const initialCount = $body.find('[data-section-id]').length
    cy.log(`Initial section count: ${initialCount}`)

    // Click the button
    cy.contains('button', buttonText).click()

    // Wait for new section to appear (count should increase by 1)
    if (initialCount === 0) {
      // If starting from 0, just wait for at least 1 section
      cy.get('[data-section-id]', { timeout: 15000 }).should('have.length.at.least', 1)
    } else {
      // If there are existing sections, wait for the count to increase
      cy.get('[data-section-id]', { timeout: 15000 }).should('have.length', initialCount + 1)
    }
  })
})

/**
 * Delete a section by index
 * @param {number} index - Section index (0-based)
 * @example cy.deleteSection(0)
 */
Cypress.Commands.add('deleteSection', (index) => {
  cy.log(`Deleting section at index ${index}`)

  // Get initial count
  cy.get('[data-section-id]').its('length').then(initialCount => {
    cy.get('[data-section-id]').eq(index).within(() => {
      cy.get('[data-testid="delete-section"]').click()
    })
    cy.contains('Yes, delete it').click()

    // Wait for section to be removed
    cy.get('[data-section-id]').should('have.length', initialCount - 1)
  })
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
    cy.get('[contenteditable="true"]').first().type(text).should('contain', text)
  })
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
