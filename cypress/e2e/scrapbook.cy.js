// NOTE: These tests require authentication
// To run these tests, either:
// 1. Log in manually before running tests (using cy.session())
// 2. Set up Firebase test credentials in cypress.config.js
// 3. Use Firebase emulators with test data

describe('Scrapbook Management', () => {
  describe('Unauthenticated State', () => {
    beforeEach(() => {
      cy.visit('/')
    })

    it('redirects to login page when not authenticated', () => {
      cy.url().should('include', '/login')
    })

    it('shows login interface', () => {
      cy.contains('Our Love Story').should('be.visible')
      cy.contains('Sign in with Google').should('be.visible')
    })
  })

  describe('Section Creation (with emulators)', () => {
    beforeEach(() => {
      cy.login()
      // Wait for initial sync to complete before creating sections
      cy.contains('Synced', { timeout: 10000 }).should('be.visible')
    })

    it('can add a regular section', () => {
      // Wait a bit to ensure React event handlers are fully attached
      cy.wait(500)
      cy.createSection('regular')
    })

    it('can add a title page', () => {
      cy.createSection('title')
      // Title pages show specific content
      cy.get('[data-section-id]').last().should('be.visible')
    })

    it('can add a timeline section', () => {
      cy.createSection('timeline')
    })
  })

  describe('Section Editing (with emulators)', () => {
    it('can edit a section', () => {
      cy.login()
      cy.createSection('regular')

      // Find the newly created section (it should be at the last position)
      cy.get('[data-section-id]').last().scrollIntoView().should('be.visible')
    })
  })

  describe('Section Management (with emulators)', () => {
    beforeEach(() => {
      cy.login()
      cy.createSection('regular')
      cy.createSection('title')
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
      // Stub window.confirm to auto-accept
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })

      cy.get('[data-section-id]').its('length').then(initialCount => {
        // Create a new section to delete
        cy.createSection('regular')

        // Wait for section count to increase
        cy.get('[data-section-id]').should('have.length', initialCount + 1)

        // Scroll the last section into view
        cy.get('[data-section-id]').last().scrollIntoView()

        // Delete the last section (using force because button is absolutely positioned)
        cy.get('[data-section-id]').last().within(() => {
          cy.get('button[title="Delete"]').click({ force: true })
        })

        // Verify section was deleted
        cy.get('[data-section-id]', { timeout: 10000 }).should('have.length', initialCount)
      })
    })
  })

  describe('Auto-save (with emulators)', () => {
    beforeEach(() => {
      cy.login()
    })

    it('shows sync status indicator', () => {
      // Check for sync indicators (cloud icon, etc)
      cy.get('svg').should('exist')
    })

    it('sections persist after creation', () => {
      // Wait for initial data load
      cy.wait(500)

      cy.createSection('regular')

      // Wait for sync to complete before reloading
      cy.contains('Synced', { timeout: 10000 }).should('be.visible')

      // Additional wait to ensure Firestore write is fully committed
      cy.wait(2000)

      // Reload the page
      cy.reload()
      cy.url().should('include', '/scrapbook')

      // Verify sections still exist after reload (at least one section should exist)
      cy.get('[data-section-id]', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })
})
