import '@testing-library/jest-dom'
import { render, screen, act } from '@testing-library/react'
import ZonesPage from '../app/zones/page'

// Mock global fetch to prevent actual network requests during testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      { id: '1', name: 'North Stand', capacity: 100, current_occupancy: 50, status: 'Normal' }
    ]),
  })
) as jest.Mock;

describe('ZonesPage Component', () => {
  it('renders the dashboard and fetches data', async () => {
    await act(async () => {
      render(<ZonesPage />)
    });
    
    // Check if main title renders
    expect(screen.getByText('Zone Management')).toBeInTheDocument();
    
    // Check if mocked data renders
    expect(screen.getByText('North Stand')).toBeInTheDocument();
  })
})
