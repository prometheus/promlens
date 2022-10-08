/// <reference types="cypress" />

context('ExpressionInput', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/');
  });

  it('types, autocompletes, and submits correctly', () => {
    cy.get('.expression-input')
      .click()
      .type('rat');

    cy.get('.cm-tooltip-autocomplete > ul > li')
      .contains('rate')
      .wait(100); // Even when the autocomplete item is already shown, we sometimes have to wait before pressing Enter :(

    cy.get('.expression-input')
      .type('{enter}')
      .type('(node_cpu');

    cy.get('.cm-tooltip-autocomplete > ul > li')
      .contains('node_cpu_seconds_total')
      .wait(100); // Even when the autocomplete item is already shown, we sometimes have to wait before pressing Enter :(

    cy.get('.expression-input').type('{downarrow}');

    cy.get('.cm-tooltip.cm-completionInfo').should('have.text', 'Seconds the cpus spent in each mode.');

    cy.get('.expression-input')
      .type('{enter}')
      .type('{mo', { parseSpecialCharSequences: false });

    cy.get('.cm-tooltip-autocomplete > ul > li')
      .contains('mode')
      .wait(100); // Even when the autocomplete item is already shown, we sometimes have to wait before pressing Enter :(

    cy.get('.expression-input')
      .type('{enter}')
      .type('!="id');

    cy.get('.cm-tooltip-autocomplete > ul > li')
      .contains('idle')
      .wait(100); // Even when the autocomplete item is already shown, we sometimes have to wait before pressing Enter :(

    cy.get('.expression-input')
      .type('{enter}')
      .type('"}', { parseSpecialCharSequences: false })
      .type('[5m]')
      .type('{enter}')
      .should('have.text', 'rate(node_cpu_seconds_total{mode!="idle"}[5m])');

    cy.get('.ast-node-inner-text').contains('rate');
    cy.get('.ast-node-inner-text').contains('node_cpu_seconds_total{mode!="idle"}[5m]');
  });
});
