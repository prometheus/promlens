/// <reference types="cypress" />

context('PromLens with no shared page', () => {
  beforeEach(() => {
    cy.server();
    cy.route2(
      { pathname: '/api/page_config' },
      {
        body: {
          now: 1603051395,
          grafanaDatasources: [
            {
              id: 1,
              orgID: 1,
              name: 'PromLabs Demo',
              type: 'prometheus',
              access: 'proxy',
              url: 'https://demo.promlabs.com',
              password: '',
              user: '',
              basicAuth: false,
              isDefault: true,
              jsonData: {},
            },
          ],
          pageState: null,
          defaultPrometheusURL: '',
        },
      }
    );
  });

  it('loads the vanilla index page without alerts', () => {
    cy.visit('http://localhost:3000/');

    cy.get('.promlens-container > .alert').should('not.exist');
  });

  it('loads the index page with URL-passed server without alerts', () => {
    cy.visit('http://localhost:3000/?s=http://prometheus-nonexistent-domain.nonexistent:9090/');

    cy.get('.promlens-container > .alert').should('not.exist');

    cy.get('.server-settings input').should('have.value', 'http://prometheus-nonexistent-domain.nonexistent:9090/');
  });

  it('loads the index page with URL-passed query without alerts', () => {
    cy.visit('http://localhost:3000/?q=23');

    cy.get('.promlens-container > .alert').should('not.exist');

    cy.get('.expression-input').should('have.text', '23');

    cy.get('.data-table td').last().should('have.text', '23');
  });
});

context('PromLens with a shared page', () => {
  beforeEach(() => {
    cy.server();
    cy.route2(
      { pathname: '/api/page_config' },
      {
        body: {
          license: { email: 'info@promlabs.com', validFrom: 0, validUntil: 9999999999 },
          now: 1603051395,
          grafanaDatasources: [
            {
              id: 1,
              orgID: 1,
              name: 'PromLabs Demo',
              type: 'prometheus',
              access: 'proxy',
              url: 'https://demo.promlabs.com',
              password: '',
              user: '',
              basicAuth: false,
              isDefault: true,
              jsonData: {},
            },
          ],
          pageState: {
            nodeVisualizer: { activeTab: 'graph', endTime: null, range: 7200000, resolution: null, stacked: false },
            queries: [
              {
                ast: {
                  args: [
                    { type: 'numberLiteral', val: '0.9' },
                    {
                      expr: {
                        args: [
                          {
                            matchers: [{ name: '__name__', type: '=', value: 'demo_api_request_duration_seconds_bucket' }],
                            name: 'demo_api_request_duration_seconds_bucket',
                            offset: 0,
                            range: 300000,
                            type: 'matrixSelector',
                          },
                        ],
                        func: { argTypes: ['matrix'], name: 'rate', returnType: 'vector', variadic: 0 },
                        type: 'call',
                      },
                      grouping: ['le', 'method', 'path'],
                      op: 'sum',
                      param: null,
                      type: 'aggregation',
                      without: false,
                    },
                  ],
                  func: { argTypes: ['scalar', 'vector'], name: 'histogram_quantile', returnType: 'vector', variadic: 0 },
                  type: 'call',
                },
                expr: 'histogram_quantile(0.9, sum by(le, method, path) (rate(demo_api_request_duration_seconds_bucket[5m])))',
                exprStale: false,
              },
              {
                ast: {
                  bool: false,
                  lhs: {
                    expr: {
                      args: [
                        {
                          matchers: [{ name: '__name__', type: '=', value: 'node_cpu_seconds_total' }],
                          name: 'node_cpu_seconds_total',
                          offset: 0,
                          range: 60000,
                          type: 'matrixSelector',
                        },
                      ],
                      func: { argTypes: ['matrix'], name: 'rate', returnType: 'vector', variadic: 0 },
                      type: 'call',
                    },
                    grouping: ['job', 'mode'],
                    op: 'sum',
                    param: null,
                    type: 'aggregation',
                    without: false,
                  },
                  matching: { card: 'many-to-one', include: [], labels: ['job'], on: true },
                  op: '/',
                  rhs: {
                    expr: {
                      args: [
                        {
                          matchers: [{ name: '__name__', type: '=', value: 'node_cpu_seconds_total' }],
                          name: 'node_cpu_seconds_total',
                          offset: 0,
                          range: 60000,
                          type: 'matrixSelector',
                        },
                      ],
                      func: { argTypes: ['matrix'], name: 'rate', returnType: 'vector', variadic: 0 },
                      type: 'call',
                    },
                    grouping: ['job'],
                    op: 'sum',
                    param: null,
                    type: 'aggregation',
                    without: false,
                  },
                  type: 'binaryExpr',
                },
                expr: 'sum by(job, mode) (rate(node_cpu_seconds_total[1m])) / on(job) group_left sum by(job)(rate(node_cpu_seconds_total[1m]))',
                exprStale: false,
              },
            ],
            selectedNodeIdx: { nodeIdx: 3, queryID: 1 },
            serverURL: 'https://demo.promlabs.com',
            version: 1,
          },
          defaultPrometheusURL: '',
        },
      }
    );
  });

  it('loads the vanilla index page without alerts', () => {
    cy.visit('http://localhost:3000/?l=OTuO7josUeU');

    cy.get('.promlens-container > .alert').should('not.exist');
    cy.get('.expression-input').contains(
      'histogram_quantile(0.9, sum by(le, method, path) (rate(demo_api_request_duration_seconds_bucket[5m])))'
    );
  });

  it('loads the index page with URL-passed server without alerts', () => {
    cy.visit('http://localhost:3000/?s=http://prometheus-nonexistent-domain.nonexistent:9090/');

    cy.get('.promlens-container > .alert').should('not.exist');

    cy.get('.expression-input').contains(
      'histogram_quantile(0.9, sum by(le, method, path) (rate(demo_api_request_duration_seconds_bucket[5m])))'
    );
    cy.get('.server-settings input').should('have.value', 'http://prometheus-nonexistent-domain.nonexistent:9090/');
  });

  it('loads the index page with URL-passed query without alerts', () => {
    cy.visit('http://localhost:3000/?q=23');

    cy.get('.promlens-container > .alert').should('not.exist');

    cy.get('.expression-input').first().should('have.text', '23');

    cy.get('.expression-input')
      .contains('histogram_quantile(0.9, sum by(le, method, path) (rate(demo_api_request_duration_seconds_bucket[5m])))')
      .should('not.exist');
  });
});
