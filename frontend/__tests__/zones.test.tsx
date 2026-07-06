import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';
import ZonesPage from '../app/zones/page';

const mockZones = [
  { id: '1', name: 'North Stand',  capacity: 15000, current_occupancy: 14200, status: 'Warning'  },
  { id: '2', name: 'South Stand',  capacity: 15000, current_occupancy: 12000, status: 'Normal'   },
  { id: '3', name: 'Food Court A', capacity: 2000,  current_occupancy: 1950,  status: 'Critical' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetchSuccess(data = mockZones) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    })
  ) as jest.Mock;
}

function mockFetchFailure(message = 'Network error') {
  global.fetch = jest.fn(() => Promise.reject(new Error(message))) as jest.Mock;
}

function mockFetchHttpError(status = 500) {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: false, status, json: () => Promise.resolve({}) })
  ) as jest.Mock;
}

afterEach(() => {
  jest.resetAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ZonesPage Component', () => {
  describe('Rendering', () => {
    it('renders the page heading', async () => {
      mockFetchSuccess();
      await act(async () => { render(<ZonesPage />); });
      expect(screen.getByRole('heading', { name: /zone management/i })).toBeInTheDocument();
    });

    it('renders the Add Zone button', async () => {
      mockFetchSuccess();
      await act(async () => { render(<ZonesPage />); });
      expect(screen.getByRole('button', { name: /add new stadium zone/i })).toBeInTheDocument();
    });

    it('renders all zone cards after successful fetch', async () => {
      mockFetchSuccess();
      await act(async () => { render(<ZonesPage />); });
      expect(screen.getByText('North Stand')).toBeInTheDocument();
      expect(screen.getByText('South Stand')).toBeInTheDocument();
      expect(screen.getByText('Food Court A')).toBeInTheDocument();
    });

    it('renders zone status badges', async () => {
      mockFetchSuccess();
      await act(async () => { render(<ZonesPage />); });
      expect(screen.getByRole('status', { name: /status: warning/i })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /status: normal/i })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /status: critical/i })).toBeInTheDocument();
    });

    it('renders occupancy numbers for each zone', async () => {
      mockFetchSuccess();
      await act(async () => { render(<ZonesPage />); });
      expect(screen.getByText(/14,200 \/ 15,000/)).toBeInTheDocument();
      expect(screen.getByText(/12,000 \/ 15,000/)).toBeInTheDocument();
      expect(screen.getByText(/1,950 \/ 2,000/)).toBeInTheDocument();
    });

    it('renders progress bars with correct ARIA attributes', async () => {
      mockFetchSuccess([{ id: '1', name: 'Test Zone', capacity: 100, current_occupancy: 75, status: 'Normal' }]);
      await act(async () => { render(<ZonesPage />); });
      const bar = screen.getByRole('progressbar', { name: /test zone occupancy at 75%/i });
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveAttribute('aria-valuenow', '75');
      expect(bar).toHaveAttribute('aria-valuemin', '0');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('Loading State', () => {
    it('shows a loading message initially', () => {
      // Do not await — check loading state before fetch resolves
      mockFetchSuccess();
      render(<ZonesPage />);
      expect(screen.getByText(/loading zones/i)).toBeInTheDocument();
    });

    it('hides the loading message after data loads', async () => {
      mockFetchSuccess();
      await act(async () => { render(<ZonesPage />); });
      expect(screen.queryByText(/loading zones/i)).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows an error message on network failure', async () => {
      mockFetchFailure('Network error');
      await act(async () => { render(<ZonesPage />); });
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    it('shows an error message on HTTP error status', async () => {
      mockFetchHttpError(500);
      await act(async () => { render(<ZonesPage />); });
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders an empty-state message when no zones are returned', async () => {
      mockFetchSuccess([]);
      await act(async () => { render(<ZonesPage />); });
      expect(screen.getByText(/no zones found/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has a main landmark', async () => {
      mockFetchSuccess();
      await act(async () => { render(<ZonesPage />); });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has a region labelled "Stadium Zones"', async () => {
      mockFetchSuccess();
      await act(async () => { render(<ZonesPage />); });
      expect(screen.getByRole('region', { name: /stadium zones/i })).toBeInTheDocument();
    });

    it('each zone card has role="article"', async () => {
      mockFetchSuccess(mockZones.slice(0, 1));
      await act(async () => { render(<ZonesPage />); });
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('loading paragraph uses aria-live="polite"', () => {
      mockFetchSuccess();
      render(<ZonesPage />);
      const loadingEl = screen.getByText(/loading zones/i);
      expect(loadingEl).toHaveAttribute('aria-live', 'polite');
    });

    it('error uses role="alert" for assistive technology', async () => {
      mockFetchFailure('Oops');
      await act(async () => { render(<ZonesPage />); });
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
