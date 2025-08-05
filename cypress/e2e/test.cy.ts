describe('template spec', () => {
  beforeEach(() => {
    // Interceptores Cypress generados automáticamente
    cy.intercept('GET', '**/api/v1/clients').as('get-api-v1-clients');
    cy.intercept('GET', '**/api/v1/clients/2').as('get-api-v1-clients-2');
    cy.intercept('POST', '**/api/v1/clients').as('post-api-v1-clients');
  });

  it('Completa', () => {
    cy.viewport(1900, 1200);
    cy.visit('/');
    //cy.get('[data-cy="lib-e2e-cypress-for-dummys"]').invoke('hide');
    cy.get('[data-cy="email-input"]').clear().type('gonzalog');
    cy.get('[data-cy="password-input"]').clear().type('1234567');
    cy.get('[data-cy="user-role"]').select('user');
    cy.get('[data-cy="login-button"]').click();
    cy.get('[data-cy="button-get-clients"]').click();
    cy.wait('@get-api-v1-clients').then((interception) => {});
    cy.get('[data-cy="button-get-client"]').click();
    cy.wait('@get-api-v1-clients-2').then((interception) => {
      if (interception.response) {
        expect(interception.response.body.name).to.equal('Lucía Ortega');
        expect(interception.response.body.lastname).to.equal('Ortega');
        expect(interception.response.body.secondLastname).to.equal('Fernández');
        expect(interception.response.body.phone).to.equal('+34 612 345 678');
        expect(interception.response.body.email).to.equal(
          'lucia.ortega@example.com'
        );
      }
    });
    cy.get('[data-cy="button-post-client"]').click();
    cy.wait('@post-api-v1-clients').then((interception) => {
      expect(interception.request.body.name).to.equal('Test Client');
      expect(interception.request.body.avatar).to.equal(undefined);
      expect(interception.request.body.lastname).to.equal('Test 2');
      expect(interception.request.body.secondLastname).to.equal('Test 3');
      expect(interception.request.body.phone).to.equal('123456789');
      expect(interception.request.body.email).to.equal('test@tes.com');
    });
  });
});
