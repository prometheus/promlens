/// <reference types="cypress" />

context('MetricsExplorer', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/');
  });

  it('the metrics explorer opens, filters, and allows inserting', () => {
    cy.get('button[title="Open metrics explorer"]').click();

    cy.get('.metrics-explorer > .data-table > tbody > tr > td > div')
      .first()
      .should('have.text', 'cadvisor_version_info');

    cy.get('.metrics-explorer input[title="Filter by text"]').type('cpu');

    cy.get('.metrics-explorer > .data-table > tbody > tr > td > div')
      .first()
      .should('have.text', 'demo_cpu_usage_seconds_total');

    cy.get('.metrics-explorer button[title="Insert metric at cursor position"]')
      .first()
      .click();

    cy.get('.expression-input').should('have.text', 'demo_cpu_usage_seconds_total');

    cy.get('.metrics-explorer button[title="Copy to clipboard"]')
      .first()
      .click(); // Can't test clipboard-related functionality in Cypress yet, so stop here.
  });
});
