import '@testing-library/jest-dom';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import IncidentsPage from '../app/incidents/page';

const mockIncidents = [
  {
    id: '1',
    description: 'Fire in North Stand',
    severity: 'critical',
    status: 'open',
    reported_by: 'Staff-A',
    zone: { name: 'North Stand' },
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    description: 'Spill on walkway',
    severity: 'warning',
    status: 'resolved',
    reported_by: 'Staff-B',
    zone: { name: 'South Stand' },
    created_at: new Date().toISOString(),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetchSuccess(data = mockIncidents) {
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

describe('IncidentsPage Component', () => {
  describe('Rendering', () => {
    it('renders the Incident Management heading', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      expect(screen.getByRole('heading', { name: /incident management/i })).toBeInTheDocument();
    });

    it('renders the Report Incident button', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      expect(screen.getByRole('button', { name: /report a new incident/i })).toBeInTheDocument();
    });

    it('renders incident rows after fetch', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      expect(screen.getByText('Fire in North Stand')).toBeInTheDocument();
      expect(screen.getByText('Spill on walkway')).toBeInTheDocument();
    });

    it('renders zone name for each incident', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      expect(screen.getByText('North Stand')).toBeInTheDocument();
      expect(screen.getByText('South Stand')).toBeInTheDocument();
    });

    it('shows "Unknown Zone" when zone is absent', async () => {
      mockFetchSuccess([{ ...mockIncidents[0], zone: undefined }]);
      await act(async () => { render(<IncidentsPage />); });
      expect(screen.getByText('Unknown Zone')).toBeInTheDocument();
    });

    it('shows Resolve button only for open incidents', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      const resolveButtons = screen.getAllByRole('button', { name: /mark incident .* as resolved/i });
      expect(resolveButtons).toHaveLength(1); // only 1 open incident in mock
    });

    it('renders an empty-state row when no incidents exist', async () => {
      mockFetchSuccess([]);
      await act(async () => { render(<IncidentsPage />); });
      expect(screen.getByText(/no incidents reported/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading message before fetch completes', () => {
      mockFetchSuccess();
      render(<IncidentsPage />);
      expect(screen.getByText(/loading incidents/i)).toBeInTheDocument();
    });

    it('hides loading message after data loads', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      expect(screen.queryByText(/loading incidents/i)).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows an alert on network failure', async () => {
      mockFetchFailure('Network error');
      await act(async () => { render(<IncidentsPage />); });
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('shows an alert on HTTP error', async () => {
      mockFetchHttpError(503);
      await act(async () => { render(<IncidentsPage />); });
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Report Incident Form', () => {
    it('opens the form when Report Incident is clicked', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      fireEvent.click(screen.getByRole('button', { name: /report a new incident/i }));
      expect(screen.getByRole('heading', { name: /report new incident/i })).toBeInTheDocument();
    });

    it('closes the form when Cancel is clicked', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      fireEvent.click(screen.getByRole('button', { name: /report a new incident/i }));
      expect(screen.getByRole('heading', { name: /report new incident/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /cancel incident report/i }));
      expect(screen.queryByRole('heading', { name: /report new incident/i })).not.toBeInTheDocument();
    });

    it('renders all required form fields', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      fireEvent.click(screen.getByRole('button', { name: /report a new incident/i }));
      expect(screen.getByLabelText(/incident description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/zone id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/severity level/i)).toBeInTheDocument();
    });

    it('submits the form and re-fetches incidents on success', async () => {
      // First call returns existing list, second call (after submit) returns updated list
      (global.fetch as jest.Mock) = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockIncidents) })       // initial load
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: '3', description: 'New', severity: 'low', status: 'open', reported_by: 'Tester', created_at: new Date().toISOString() }) }) // POST
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockIncidents) });      // re-fetch

      await act(async () => { render(<IncidentsPage />); });
      fireEvent.click(screen.getByRole('button', { name: /report a new incident/i }));

      fireEvent.change(screen.getByLabelText(/incident description/i), {
        target: { value: 'Broken gate' },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /submit the incident report/i }));
      });

      // fetch should have been called at least twice (initial + POST)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('does not submit when description is empty', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      fireEvent.click(screen.getByRole('button', { name: /report a new incident/i }));
      // Leave description blank — the native required attribute prevents submission,
      // so fetch should still only have been called once (initial load)
      fireEvent.click(screen.getByRole('button', { name: /submit the incident report/i }));
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('severity select defaults to "low"', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      fireEvent.click(screen.getByRole('button', { name: /report a new incident/i }));
      const select = screen.getByRole('combobox', { name: /severity level/i }) as HTMLSelectElement;
      expect(select.value).toBe('low');
    });

    it('renders all three severity options', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      fireEvent.click(screen.getByRole('button', { name: /report a new incident/i }));
      expect(screen.getByRole('option', { name: /low/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /warning/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /critical/i })).toBeInTheDocument();
    });
  });

  describe('Resolve Incident', () => {
    it('calls the resolve endpoint when Resolve is clicked', async () => {
      (global.fetch as jest.Mock) = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockIncidents) })   // initial load
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ...mockIncidents[0], status: 'resolved' }) }) // PUT
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockIncidents) });  // re-fetch

      await act(async () => { render(<IncidentsPage />); });

      const resolveBtn = screen.getByRole('button', { name: /mark incident .* as resolved/i });
      await act(async () => { fireEvent.click(resolveBtn); });

      const calls = (global.fetch as jest.Mock).mock.calls;
      const resolveCall = calls.find(([url, opts]) => opts?.method === 'PUT');
      expect(resolveCall).toBeDefined();
      expect(resolveCall[0]).toMatch(/\/api\/incidents\/1\/resolve/);
    });
  });

  describe('Accessibility', () => {
    it('has a main landmark', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('incident table has an accessible label', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      expect(screen.getByRole('table', { name: /stadium incidents/i })).toBeInTheDocument();
    });

    it('table headers have scope="col"', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      const headers = screen.getAllByRole('columnheader');
      headers.forEach(th => expect(th).toHaveAttribute('scope', 'col'));
    });

    it('report button has aria-expanded reflecting form state', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      const btn = screen.getByRole('button', { name: /report a new incident/i });
      expect(btn).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(btn);
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveAttribute('aria-expanded', 'true');
    });

    it('description input has aria-required="true"', async () => {
      mockFetchSuccess();
      await act(async () => { render(<IncidentsPage />); });
      fireEvent.click(screen.getByRole('button', { name: /report a new incident/i }));
      expect(screen.getByLabelText(/incident description/i)).toHaveAttribute('aria-required', 'true');
    });
  });
});
