import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Home from '../app/page'

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

describe('Home Page', () => {
  it('renders dashboard overview', () => {
    render(<Home />)
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  })
})
