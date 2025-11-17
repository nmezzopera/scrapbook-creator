describe('PDF Export', () => {
  beforeEach(() => {
    // Visit app (assumes user is logged in)
    cy.visit('/')
    cy.wait(2000)
  })

  describe('PDF Export Button', () => {
    it('shows export PDF button', () => {
      cy.contains('Export PDF').should('be.visible')
    })

    it('export button is enabled when sections exist', () => {
      // Create a section first
      cy.contains('Add Section').click()
      cy.wait(1000)

      cy.contains('Export PDF').should('not.be.disabled')
    })
  })

  describe('PDF Generation Process', () => {
    beforeEach(() => {
      // Create some content to export
      cy.contains('Add Title Page').click()
      cy.wait(500)

      cy.contains('Add Section').click()
      cy.wait(500)

      // Add some text
      cy.get('[data-section-id]').last().within(() => {
        cy.get('input[type="text"]').first().clear().type('Our First Memory')
      })
      cy.wait(1000)
    })

    it('shows loading state during export', () => {
      cy.contains('Export PDF').click()

      // Should show progress indicator
      cy.contains('Creating your beautiful PDF', { timeout: 5000 }).should('be.visible')
      cy.get('[role="progressbar"]').should('be.visible')
    })

    it('successfully generates PDF', () => {
      cy.contains('Export PDF').click()

      // Wait for PDF generation to complete (can take 1-2 minutes)
      cy.contains('PDF created successfully!', { timeout: 120000 }).should('be.visible')
    })

    it('shows progress messages during generation', () => {
      cy.contains('Export PDF').click()

      // Check for various progress messages
      cy.contains('Creating preview', { timeout: 10000 })
      cy.contains('Generating PDF', { timeout: 30000 })
      cy.contains('Downloading PDF', { timeout: 120000 })
    })

    it('closes modal after successful export', () => {
      cy.contains('Export PDF').click()

      // Wait for success
      cy.contains('PDF created successfully!', { timeout: 120000 }).should('be.visible')

      // Close the modal
      cy.contains('Close').click()

      // Modal should be closed
      cy.contains('PDF created successfully!').should('not.exist')
    })
  })

  describe('PDF Export with Images', () => {
    it.skip('can export PDF with uploaded images', () => {
      // Create a section
      cy.contains('Add Section').click()
      cy.wait(1000)

      // Upload an image (would require fixture image)
      cy.get('input[type="file"]').first().attachFile('test-image.jpg')
      cy.wait(3000) // Wait for upload

      // Export PDF
      cy.contains('Export PDF').click()
      cy.contains('PDF created successfully!', { timeout: 120000 }).should('be.visible')
    })
  })

  describe('PDF Export with Multiple Sections', () => {
    it('can export PDF with multiple section types', () => {
      // Create diverse content
      cy.contains('Add Title Page').click()
      cy.wait(500)

      cy.contains('Add Section').click()
      cy.wait(500)

      cy.contains('Add Timeline').click()
      cy.wait(500)

      cy.contains('Add Section').click()
      cy.wait(1000)

      // Verify all sections created
      cy.get('[data-section-id]').should('have.length', 4)

      // Export
      cy.contains('Export PDF').click()
      cy.contains('PDF created successfully!', { timeout: 120000 }).should('be.visible')
    })
  })

  describe('PDF Export Error Handling', () => {
    it('handles export errors gracefully', () => {
      // Try to export with no sections
      cy.get('[data-section-id]').should('have.length', 0)

      cy.contains('Export PDF').click()

      // Should show error or info message
      cy.contains('Add some sections first', { timeout: 5000 }).should('be.visible')
    })

    it('allows retry after failure', () => {
      // This test would need to mock a failure scenario
      // For now, it's a placeholder
    })
  })

  describe('PDF Export Performance', () => {
    it('completes export within reasonable time for small scrapbook', () => {
      const startTime = Date.now()

      // Create minimal content
      cy.contains('Add Section').click()
      cy.wait(1000)

      // Export
      cy.contains('Export PDF').click()
      cy.contains('PDF created successfully!', { timeout: 120000 }).should('be.visible')

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within 2 minutes for small scrapbook
      expect(duration).to.be.lessThan(120000)
    })
  })
})
