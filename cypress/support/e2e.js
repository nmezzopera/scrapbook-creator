// Import Cypress Firebase commands
import 'cypress-firebase'

// Import custom commands
import './commands'

// Hide fetch/XHR logs for cleaner output (optional)
const app = window.top

if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style')
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }'
  style.setAttribute('data-hide-command-log-request', '')
  app.document.head.appendChild(style)
}

// Preserve cookies between tests
Cypress.Cookies.defaults({
  preserve: ['session', '__session'],
})

// Global before hook
before(() => {
  cy.log('Starting E2E Test Suite')
})

// Global after hook
after(() => {
  cy.log('Finished E2E Test Suite')
})
