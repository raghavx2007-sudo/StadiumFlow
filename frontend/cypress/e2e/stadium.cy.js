/**
 * StadiumFlow E2E Tests
 * Covers full user workflows across the dashboard, zones, and incidents pages.
 */

// ─── API Intercept Fixtures ────────────────────────────────────────────────────

const mockZones = [
  { id: 'z1', name: 'North Stand',  capacity: 15000, current_occupancy: 14200, status: 'Warning'  },
  { id: 'z2', name: 'South Stand',  capacity: 15000, current_occupancy: 12000, status: 'Normal'   },
  { id: 'z3', name: 'Food Court A', capacity: 2000,  current_occupancy: 1950,  status: 'Critical' },
];

const mockIncidents = [
  {
    id: 'i1',
    description: 'Medical Emergency',
    severity: 'critical',
    status: 'open',
    reported_by: 'Staff-A',
    zone: { name: 'North Stand' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'i2',
    description: 'Spill on Walkway',
    severity: 'warning',
    status: 'resolved',
    reported_by: 'Staff-B',
    zone: { name: 'South Stand' },
    created_at: new Date().toISOString(),
  },
];

// ─── Dashboard Page ────────────────────────────────────────────────────────────

describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('displays the Dashboard Overview heading', () => {
    cy.contains('h1', 'Dashboard Overview').should('be.visible');
  });

  it('displays real-time subtitle', () => {
    cy.contains('Real-time stadium status').should('be.visible');
  });

  it('displays the active match indicator', () => {
    cy.contains('Active Match: Semi-Finals').should('be.visible');
  });

  it('displays all three stat cards', () => {
    cy.contains('Total Attendance').should('be.visible');
    cy.contains('Active Incidents').should('be.visible');
    cy.contains('Staff Deployed').should('be.visible');
  });

  it('displays the Live Zones section', () => {
    cy.contains('h2', 'Live Zones').should('be.visible');
    cy.contains('Medical Emergency').should('be.visible');
    cy.contains('Spill on Walkway').should('be.visible');
  });

  it('View All link navigates to zones page', () => {
    cy.get('a[aria-label="View all stadium zones"]').click();
    cy.url().should('include', '/zones');
  });
});

// ─── Sidebar Navigation ───────────────────────────────────────────────────────

describe('Sidebar Navigation', () => {
  it('navigates from Dashboard to Zone Management', () => {
    cy.visit('/');
    cy.get('nav').contains('Zone Management').click();
    cy.url().should('include', '/zones');
    cy.contains('h1', 'Zone Management').should('be.visible');
  });

  it('navigates from Dashboard to Incidents', () => {
    cy.visit('/');
    cy.get('nav').contains('Incidents').click();
    cy.url().should('include', '/incidents');
    cy.contains('h1', 'Incident Management').should('be.visible');
  });

  it('navigates back to Dashboard from Zones', () => {
    cy.visit('/zones');
    cy.get('nav').contains('Dashboard').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.contains('h1', 'Dashboard Overview').should('be.visible');
  });
});

// ─── Zone Management Page ─────────────────────────────────────────────────────

describe('Zone Management Page', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/zones', { statusCode: 200, body: mockZones }).as('getZones');
    cy.visit('/zones');
    cy.wait('@getZones');
  });

  it('displays the Zone Management heading', () => {
    cy.contains('h1', 'Zone Management').should('be.visible');
  });

  it('displays the Add Zone button', () => {
    cy.get('button[aria-label="Add new stadium zone"]').should('be.visible');
  });

  it('renders all zone cards from API', () => {
    cy.contains('North Stand').should('be.visible');
    cy.contains('South Stand').should('be.visible');
    cy.contains('Food Court A').should('be.visible');
  });

  it('shows status badges for zones', () => {
    cy.contains('Warning').should('be.visible');
    cy.contains('Normal').should('be.visible');
    cy.contains('Critical').should('be.visible');
  });

  it('shows occupancy information for zones', () => {
    cy.contains('14,200 / 15,000').should('be.visible');
  });

  it('shows an error message when API fails', () => {
    cy.intercept('GET', '**/api/zones', { forceNetworkError: true }).as('zonesError');
    cy.visit('/zones');
    cy.wait('@zonesError');
    cy.get('[role="alert"]').should('be.visible');
  });
});

// ─── Incident Management Page ─────────────────────────────────────────────────

describe('Incident Management Page', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/incidents', { statusCode: 200, body: mockIncidents }).as('getIncidents');
    cy.visit('/incidents');
    cy.wait('@getIncidents');
  });

  it('displays the Incident Management heading', () => {
    cy.contains('h1', 'Incident Management').should('be.visible');
  });

  it('displays incidents in the table', () => {
    cy.contains('Medical Emergency').should('be.visible');
    cy.contains('Spill on Walkway').should('be.visible');
  });

  it('shows the correct zone names for incidents', () => {
    cy.contains('North Stand').should('be.visible');
    cy.contains('South Stand').should('be.visible');
  });

  it('shows Resolve button only for open incidents', () => {
    cy.get('button[aria-label*="as resolved"]').should('have.length', 1);
  });

  it('shows error message when API fails', () => {
    cy.intercept('GET', '**/api/incidents', { forceNetworkError: true }).as('incidentsError');
    cy.visit('/incidents');
    cy.wait('@incidentsError');
    cy.get('[role="alert"]').should('be.visible');
  });
});

// ─── Report Incident Workflow ─────────────────────────────────────────────────

describe('Report Incident Workflow', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/incidents', { statusCode: 200, body: mockIncidents }).as('getIncidents');
    cy.visit('/incidents');
    cy.wait('@getIncidents');
  });

  it('opens the report form when Report Incident is clicked', () => {
    cy.get('button[aria-label="Report a new incident"]').click();
    cy.contains('h2', 'Report New Incident').should('be.visible');
  });

  it('closes the form when Cancel is clicked', () => {
    cy.get('button[aria-label="Report a new incident"]').click();
    cy.contains('h2', 'Report New Incident').should('be.visible');
    cy.get('button[aria-label="Cancel incident report"]').click();
    cy.contains('h2', 'Report New Incident').should('not.exist');
  });

  it('submits a new incident and reloads the list', () => {
    const newIncident = { id: 'i3', description: 'Broken Gate', severity: 'low', status: 'open', reported_by: 'Tester', zone: { name: 'North Stand' }, created_at: new Date().toISOString() };

    cy.intercept('POST', '**/api/incidents', { statusCode: 201, body: newIncident }).as('postIncident');
    cy.intercept('GET', '**/api/incidents', { statusCode: 200, body: [...mockIncidents, newIncident] }).as('refreshIncidents');

    cy.get('button[aria-label="Report a new incident"]').click();
    cy.get('#description').type('Broken Gate');
    cy.get('#severity').select('low');
    cy.get('button[aria-label="Submit the incident report"]').click();

    cy.wait('@postIncident');
    cy.contains('Broken Gate').should('be.visible');
  });
});

// ─── Resolve Incident Workflow ────────────────────────────────────────────────

describe('Resolve Incident Workflow', () => {
  it('marks an incident as resolved', () => {
    const resolvedList = [
      { ...mockIncidents[0], status: 'resolved' },
      mockIncidents[1],
    ];

    cy.intercept('GET', '**/api/incidents', { statusCode: 200, body: mockIncidents }).as('getIncidents');
    cy.visit('/incidents');
    cy.wait('@getIncidents');

    cy.intercept('PUT', '**/api/incidents/i1/resolve', { statusCode: 200, body: { ...mockIncidents[0], status: 'resolved' } }).as('resolveIncident');
    cy.intercept('GET', '**/api/incidents', { statusCode: 200, body: resolvedList }).as('refreshIncidents');

    cy.get('button[aria-label*="as resolved"]').first().click();
    cy.wait('@resolveIncident');
    cy.wait('@refreshIncidents');

    cy.get('button[aria-label*="as resolved"]').should('not.exist');
  });
});
