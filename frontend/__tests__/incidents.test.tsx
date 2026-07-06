import '@testing-library/jest-dom'
import { render, screen, act } from '@testing-library/react'
import IncidentsPage from '../app/incidents/page'

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      { id: '1', description: 'Fire', severity: 'critical', status: 'open', reported_by: 'Staff', zone: { name: 'VIP' } }
    ]),
  })
) as jest.Mock;

describe('IncidentsPage Component', () => {
  it('renders incidents', async () => {
    await act(async () => {
      render(<IncidentsPage />)
    });
    expect(screen.getByText('Incident Management')).toBeInTheDocument();
  })
})
