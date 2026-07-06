describe('StadiumFlow E2E', () => {
  it('Visits the Zones Dashboard', () => {
    cy.visit('/zones')
    cy.contains('Zone Management')
  })

  it('Visits the Incidents Dashboard', () => {
    cy.visit('/incidents')
    cy.contains('Incident Management')
  })
})
