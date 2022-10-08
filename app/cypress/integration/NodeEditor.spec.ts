/// <reference types="cypress" />

context('NodeEditor', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/');
    cy.get('.ast-visualizer button[title="Edit as form (E)"]').click();
  });

  it('allows creating selectors via form', () => {
    cy.get('.node-editor input[placeholder="metric name"')
      .click()
      .type('node_cpu');

    cy.get('.node-editor .react-autosuggest__suggestion')
      .contains('node_cpu_seconds_total')
      .click();

    cy.get('.node-editor input[placeholder="label name"]')
      .click()
      .type('mo');

    cy.get('.node-editor .react-autosuggest__suggestion')
      .contains('mode')
      .click();

    cy.get('option[value="="]')
      .parent()
      .select('!=');

    cy.get('.node-editor input[placeholder="label value"]')
      .as('labelValueInput')
      .type('id');

    cy.get('.node-editor .react-autosuggest__suggestion')
      .contains('idle')
      .click();

    cy.get('@labelValueInput').type('{enter}');

    cy.get('button[title="Apply changes"]')
      .click()
      .type('{esc}');

    cy.get('button[title="Update input from tree"]').click();

    cy.get('.cm-expression-input').should('have.text', 'node_cpu_seconds_total{mode!="idle"}');
  });
});
