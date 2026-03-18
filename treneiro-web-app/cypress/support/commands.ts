/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
        login(email?: string, password?: string): Chainable<void>
    }
}

Cypress.Commands.add('login', (email = 'admin@admin.com', password = 'password') => {
    cy.visit('/login');
    cy.get('input[type="email"]').clear().type(email);
    cy.get('input[type="password"]').clear().type(password);
    cy.get('button[type="submit"]').click();
    // After login, the auth store redirects to '/' which is the Dashboard
    cy.url().should('eq', Cypress.config().baseUrl + '/');
})
