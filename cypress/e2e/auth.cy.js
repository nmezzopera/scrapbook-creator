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

  // Note: Actual Google sign-in requires manual interaction or service account
  // For full automation, you'd use cypress-firebase with a test account
  it.skip('can sign in with Google', () => {
    cy.contains('Sign in with Google').click()
    // This would require Firebase test credentials
    cy.url().should('not.include', '/login')
    cy.contains('Our Love Story').should('be.visible')
  })
})
