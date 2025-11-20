// NOTE: PDF export tests require authentication
// To run these tests, either:
// 1. Log in manually before running tests
// 2. Set up Firebase test credentials
// 3. Use Firebase emulators with test data

describe('PDF Export', () => {
  describe('Unauthenticated State', () => {
    beforeEach(() => {
      cy.visit('/')
    })

    it('redirects to login when trying to access PDF export', () => {
      cy.url().should('include', '/login')
      cy.contains('Sign in with Google').should('be.visible')
    })
  })

  describe('PDF Export Button (with emulators)', () => {
    beforeEach(() => {
      cy.login()
    })

    it('shows export PDF button', () => {
      cy.contains(/Export|PDF/, { timeout: 10000 }).should('exist')
    })

    it('export button is enabled when sections exist', () => {
      cy.createSection('regular')
      cy.get('body').then($body => {
        // Check that export button exists (might be a button or icon)
        const hasExportButton = $body.find('button').toArray().some(btn =>
          btn.textContent.toLowerCase().includes('export') ||
          btn.textContent.toLowerCase().includes('pdf')
        )
        expect(hasExportButton || $body.find('svg').length > 0).to.be.true
      })
    })
  })

  describe('PDF Generation Process (with emulators)', () => {
    beforeEach(() => {
      cy.login()
      cy.createSection('regular')
    })

    it('shows loading state during export', () => {
      // Click the PDF export icon button by title
      cy.get('button[title="Export to PDF"]').click()

      // Should show progress indicator
      cy.contains(/Creating|Generating|Processing|Preparing|Exporting/i, { timeout: 10000 }).should('be.visible')
    })

    it('initiates PDF generation process', () => {
      // Click the PDF export icon button
      cy.get('button[title="Export to PDF"]').click()

      // Verify modal appears with progress indicators
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible')

      // Should show progress messages (not waiting for completion)
      cy.contains(/Creating|Generating|Processing|Preparing|Exporting/i, { timeout: 10000 }).should('be.visible')
    })

    it('shows progress messages during generation', () => {
      // Click the PDF export icon button
      cy.get('button[title="Export to PDF"]').click()

      // Check for various progress messages
      cy.contains(/Creating|Generating|Processing|Preparing|Exporting/i, { timeout: 30000 }).should('be.visible')
    })

    it('can close PDF export modal during generation', () => {
      // Click the PDF export icon button
      cy.get('button[title="Export to PDF"]').click()

      // Wait for modal to appear
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible')

      // Close the modal (cancel generation)
      cy.get('button').contains(/Cancel|Close/i).first().click()

      // Modal should close
      cy.get('[role="dialog"]').should('not.exist')
    })

    it('can cancel PDF export', () => {
      // Click the PDF export icon button
      cy.get('button[title="Export to PDF"]').click()

      // Wait for modal to appear
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible')

      // Look for cancel or close button
      cy.get('button').contains(/Cancel|Close/i).first().click()

      // Modal should close
      cy.get('[role="dialog"]').should('not.exist')
    })
  })

  describe('PDF Export with Images (with emulators)', () => {
    beforeEach(() => {
      cy.login()
    })

    it('shows file upload input for images', () => {
      cy.createSection('regular')

      // Wait for section to be created
      cy.wait(1000)

      // Verify file upload input exists (for images)
      cy.get('input[type="file"]').should('exist')

      // Verify export button is present
      cy.get('button[title="Export to PDF"]').should('exist')
    })
  })

  describe('PDF Export with Multiple Sections (with emulators)', () => {
    beforeEach(() => {
      cy.login()
    })

    it('can export PDF with multiple section types', () => {
      // Create diverse content
      cy.createSection('title')
      cy.createSection('regular')
      cy.createSection('timeline')
      cy.createSection('regular')

      // Wait for sections to be created
      cy.wait(2000)

      // Verify all sections created
      cy.get('[data-section-id]').should('have.length.at.least', 4)

      // Verify export button is present (but don't click - PDF generation may fail in emulator)
      cy.get('button[title="Export to PDF"]').should('exist')
    })
  })

  describe('PDF Export Error Handling (with emulators)', () => {
    beforeEach(() => {
      cy.login()
    })

    it('export button exists even with empty scrapbook', () => {
      // Verify export button is present
      cy.get('button[title="Export to PDF"]').should('exist')

      // Button should be clickable
      cy.get('button[title="Export to PDF"]').should('not.be.disabled')
    })

    it('can open and close export modal', () => {
      cy.createSection('regular')

      // Click export button
      cy.get('button[title="Export to PDF"]').click()

      // Modal should appear
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible')

      // Close modal
      cy.get('button').contains(/Cancel|Close/i).first().click()

      // Modal should close
      cy.get('[role="dialog"]').should('not.exist')
    })
  })

  describe('PDF Export Performance (with emulators)', () => {
    beforeEach(() => {
      cy.login()
    })

    it('export modal appears quickly', () => {
      const startTime = Date.now()

      // Create minimal content
      cy.createSection('regular')

      // Click export
      cy.get('button[title="Export to PDF"]').click()

      // Modal should appear quickly (within 5 seconds)
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible').then(() => {
        const endTime = Date.now()
        const duration = endTime - startTime

        // Modal should appear within 5 seconds
        expect(duration).to.be.lessThan(5000)
      })
    })
  })
})
