describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('displays the landing page', () => {
    cy.contains('Our Love Story').should('be.visible')
    cy.contains('A collection of our most precious moments').should('be.visible')
  })

  it('redirects to login when not authenticated', () => {
    cy.url().should('include', '/login')
  })

  it('shows sign in button', () => {
    cy.contains('Sign in with Google').should('be.visible')
  })

  describe('With Emulators', () => {
    it('can sign in with emulator auth', () => {
      cy.login()
      cy.url().should('include', '/scrapbook')
      cy.contains('Our Love Story').should('be.visible')
    })

    it('shows authenticated UI elements', () => {
      cy.login()
      // Should show user interface elements (buttons, icons, etc)
      cy.get('button').should('exist')
      cy.get('svg').should('exist')
    })
  })
})
