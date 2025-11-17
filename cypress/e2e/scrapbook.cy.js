// NOTE: These tests require authentication
// To run these tests, either:
// 1. Log in manually before running tests (using cy.session())
// 2. Set up Firebase test credentials in cypress.config.js
// 3. Use Firebase emulators with test data

describe('Scrapbook Management', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait(2000) // Wait for auth state
  })

  describe('Unauthenticated State', () => {
    it('redirects to login page when not authenticated', () => {
      cy.url().should('include', '/login')
    })

    it('shows login interface', () => {
      cy.contains('Our Love Story').should('be.visible')
      cy.contains('Sign in with Google').should('be.visible')
    })
  })

  // These tests require authentication - skip for now
  describe.skip('Section Creation (requires auth)', () => {
    beforeEach(() => {
      // TODO: Add cy.login() here when test credentials are set up
    })

    it('can add a regular section', () => {
      cy.contains('Add Section').click()
      cy.get('[data-section-id]').should('have.length.at.least', 1)
    })

    it('can add a title page', () => {
      cy.contains('Add Title Page').click()
      cy.get('[data-section-id]').should('have.length.at.least', 1)
      cy.contains('Your Title Here').should('be.visible')
    })

    it('can add a timeline section', () => {
      cy.contains('Add Timeline').click()
      cy.get('[data-section-id]').should('have.length.at.least', 1)
      cy.contains('Key Events').should('be.visible')
    })
  })

  describe.skip('Section Editing (requires auth)', () => {
    beforeEach(() => {
      // Create a section to edit
      cy.contains('Add Section').click()
      cy.wait(1000)
    })

    it('can edit section title', () => {
      cy.get('[data-section-id]').first().within(() => {
        cy.get('input[type="text"]').first().clear().type('Our First Date')
        cy.get('input[type="text"]').first().should('have.value', 'Our First Date')
      })
    })

    it('can add description text', () => {
      cy.get('[data-section-id]').first().within(() => {
        // Find the description editor
        cy.get('[contenteditable="true"]').first().click()
        cy.get('[contenteditable="true"]').first().type('This is our love story beginning...')
      })

      cy.wait(1000)
      cy.contains('This is our love story beginning...').should('be.visible')
    })
  })

  describe.skip('Section Management (requires auth)', () => {
    beforeEach(() => {
      // Create multiple sections
      cy.contains('Add Section').click()
      cy.wait(500)
      cy.contains('Add Title Page').click()
      cy.wait(500)
    })

    it('displays multiple sections', () => {
      cy.get('[data-section-id]').should('have.length.at.least', 2)
    })

    it('can reorder sections', () => {
      // Check if sections exist
      cy.get('[data-section-id]').should('have.length.at.least', 2)

      // Note: Actual drag-and-drop testing would require more setup
      // This is a placeholder for reordering functionality
    })

    it('can delete a section', () => {
      cy.get('[data-section-id]').its('length').then((initialCount) => {
        cy.get('[data-section-id]').first().within(() => {
          // Find and click delete button (icon button)
          cy.get('button[aria-label*="delete"], button[title*="Delete"]').first().click()
        })

        // Confirm deletion if there's a dialog
        cy.contains('Yes, delete it', { timeout: 3000 }).click().then(() => {
          cy.get('[data-section-id]').should('have.length', initialCount - 1)
        })
      })
    })
  })

  describe.skip('Auto-save (requires auth)', () => {
    it('shows sync status indicator', () => {
      // Check for sync indicators
      cy.get('[data-testid="sync-status"], svg').should('exist')
    })

    it('auto-saves changes', () => {
      cy.contains('Add Section').click()
      cy.wait(2000) // Wait for auto-save

      // Check for "saved" or "synced" indicator
      cy.get('body').then(($body) => {
        // Check if any sync/save indicator exists
        expect(
          $body.text().includes('Saved') ||
          $body.text().includes('Synced') ||
          $body.find('[data-testid="cloud-done"]').length > 0
        ).to.be.true
      })
    })
  })
})
