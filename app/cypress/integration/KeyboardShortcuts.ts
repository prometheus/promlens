/// <reference types="cypress" />

context('KeyboardShortcuts', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/?example');
  });

  it('allows creating selectors via form', () => {
    cy.get('.ast-node-selected .ast-node-inner-text')
      .contains('/ on(job) group_left()')
      .click();

    cy.get('body')
      .type('r')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('histogram_quantile');

    cy.get('body')
      .type('j')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('0.9');

    cy.get('body')
      .type('j')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('sum by(le, method, path)');

    cy.get('body')
      .type('j')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('rate');

    cy.get('body')
      .type('j')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('demo_api_request_duration_seconds_bucket[5m]');

    cy.get('body')
      .type('j')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('histogram_quantile');

    cy.get('body')
      .type('k')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('demo_api_request_duration_seconds_bucket[5m]');

    cy.get('body')
      .type('k')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('rate');

    cy.get('body')
      .type('n')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('/ on(job) group_left()');

    cy.get('body')
      .type('n')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('histogram_quantile');

    cy.get('body')
      .type('p')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('/ on(job) group_left()');

    cy.get('body')
      .type('p')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('histogram_quantile');

    cy.get('body')
      .type('a')
      .get('.ast-node-selected .ast-node-inner-text')
      .contains('start query');
  });
});
