describe('template spec', () => {
  beforeEach(() => {
  // Interceptores Cypress generados automáticamente
  cy.intercept('GET', '**/api/v1/clients').as('get-api-v1-clients')
  cy.intercept('GET', '**/api/v1/clients/2').as('get-api-v1-clients-2')
  cy.intercept('POST', '**/api/v1/clients').as('post-api-v1-clients')
  // Interceptores Cypress generados automáticamente
  cy.intercept('POST', '**/api/v1/clients').as('post-api-v1-clients')

  })


  beforeEach(() => {
    // Interceptores Cypress generados automáticamente
    cy.intercept('GET', '**/api/v1/clients').as('get-api-v1-clients')
    cy.intercept('GET', '**/api/v1/clients/2').as('get-api-v1-clients-2')
    cy.intercept('POST', '**/api/v1/clients').as('post-api-v1-clients')
  })

  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })

  it('Prueba completisima', () => {
    cy.viewport(1900, 1200)
    cy.visit('/')
    cy.get('[data-cy="lib-e2e-cypress-for-dummys"]').invoke('hide');
    cy.get('[data-cy="email-input"]').clear().type('gonzalo.carmenado@iesa.es')
    cy.get('[data-cy="password-input"]').clear().type('123456')
    cy.get('[data-cy="login-button"]').click()
    cy.wait('@get-api-v1-clients').then((interception) => { })
    cy.wait('@get-api-v1-clients-2').then((interception) => {
      if (interception.response) {
        expect(interception.response.body.createdAt).to.equal("2024-12-01T10:32:45Z");
        expect(interception.response.body.name).to.equal("Lucía Ortega");
        expect(interception.response.body.avatar).to.equal("https://i.pravatar.cc/150?img=1");
        expect(interception.response.body.lastname).to.equal("Ortega");
        expect(interception.response.body.secondLastname).to.equal("Fernández");
        expect(interception.response.body.phone).to.equal("+34 612 345 678");
        expect(interception.response.body.email).to.equal("lucia.ortega@example.com");
      }
    })
    cy.wait('@post-api-v1-clients').then((interception) => {
      expect(interception.request.body.createdAt).to.equal("2025-07-06T07:10:02.334Z");
      expect(interception.request.body.name).to.equal("Test Client");
      expect(interception.request.body.avatar).to.equal(undefined);
      expect(interception.request.body.lastname).to.equal("Test 2");
      expect(interception.request.body.secondLastname).to.equal("Test 3");
      expect(interception.request.body.phone).to.equal("123456789");
      expect(interception.request.body.email).to.equal("test@tes.com");
    })
  });
it('dasda', () => {
  cy.viewport(1900, 1200)
  cy.visit('/navigation-window')
  cy.get('[data-cy="lib-e2e-cypress-for-dummys"]').invoke('hide');
  cy.get('[data-cy="email-input"]').clear().type('dasda')
  cy.get('[data-cy="password-input"]').clear().type('dsada')
  cy.get('[data-cy="user-role"]').select('user')
  cy.get('[data-cy="login-button"]').click()
  cy.wait('@post-api-v1-clients').then((interception) => {
expect(interception.request.body.createdAt).to.equal("2025-08-03T16:13:36.000Z");
expect(interception.request.body.name).to.equal("Test Client");
expect(interception.request.body.avatar).to.equal(undefined);
expect(interception.request.body.lastname).to.equal("Test 2");
expect(interception.request.body.secondLastname).to.equal("Test 3");
expect(interception.request.body.phone).to.equal("123456789");
expect(interception.request.body.email).to.equal("test@tes.com");
})
});
it('as', () => {
  cy.viewport(1900, 1200)
  cy.visit('/')
  cy.get('[data-cy="lib-e2e-cypress-for-dummys"]').invoke('hide');
});

it('fdsfs', () => {
  cy.viewport(1900, 1200)
  cy.visit('/')
  cy.get('[data-cy="lib-e2e-cypress-for-dummys"]').invoke('hide');
  cy.get('[data-cy="login-button"]').click()
  cy.get('[data-cy="password-input"]').clear().type('dasda')
});

it('dasdasda', () => {
  cy.viewport(1900, 1200)
  cy.visit('/')
  cy.get('[data-cy="lib-e2e-cypress-for-dummys"]').invoke('hide');
  cy.get('[data-cy="email-input"]').clear().type('dsada')
  cy.get('[data-cy="user-role"]').select('user')
  cy.get('[data-cy="password-input"]').clear().type('dasda')
  cy.get('[data-cy="login-button"]').click()
  cy.wait('@get-api-v1-clients').then((interception) => { })
  cy.wait('@get-api-v1-clients-2').then((interception) => {
  if (interception.response) {
expect(interception.response.body.createdAt).to.equal("2024-12-01T10:32:45Z");
expect(interception.response.body.name).to.equal("Lucía Ortega");
expect(interception.response.body.avatar).to.equal("https://i.pravatar.cc/150?img=1");
expect(interception.response.body.lastname).to.equal("Ortega");
expect(interception.response.body.secondLastname).to.equal("Fernández");
expect(interception.response.body.phone).to.equal("+34 612 345 678");
expect(interception.response.body.email).to.equal("lucia.ortega@example.com");
  }
})
  cy.wait('@post-api-v1-clients').then((interception) => {
expect(interception.request.body.createdAt).to.equal("2025-08-03T06:43:44.200Z");
expect(interception.request.body.name).to.equal("Test Client");
expect(interception.request.body.avatar).to.equal(undefined);
expect(interception.request.body.lastname).to.equal("Test 2");
expect(interception.request.body.secondLastname).to.equal("Test 3");
expect(interception.request.body.phone).to.equal("123456789");
expect(interception.request.body.email).to.equal("test@tes.com");
})
  cy.url().should('include', '/navigation-window')
});
})