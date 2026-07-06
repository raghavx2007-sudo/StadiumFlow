import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Home from '../app/page';

describe('Home Page', () => {
  beforeEach(() => {
    render(<Home />);
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders the main dashboard heading', () => {
    expect(screen.getByRole('heading', { name: /dashboard overview/i })).toBeInTheDocument();
  });

  it('renders the real-time subtitle', () => {
    expect(screen.getByText(/real-time stadium status/i)).toBeInTheDocument();
  });

  it('renders the active match indicator', () => {
    expect(screen.getByText(/active match: semi-finals/i)).toBeInTheDocument();
  });

  // ── Stats Cards ───────────────────────────────────────────────────────────

  it('renders Total Attendance stat card', () => {
    expect(screen.getByRole('heading', { name: /total attendance/i })).toBeInTheDocument();
    expect(screen.getByText('45,210')).toBeInTheDocument();
    expect(screen.getByText(/82% of capacity/i)).toBeInTheDocument();
  });

  it('renders Active Incidents stat card', () => {
    expect(screen.getByRole('heading', { name: /active incidents/i })).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/3 critical/i)).toBeInTheDocument();
  });

  it('renders Staff Deployed stat card', () => {
    expect(screen.getByRole('heading', { name: /staff deployed/i })).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
    expect(screen.getByText(/optimal coverage/i)).toBeInTheDocument();
  });

  // ── Live Zones Section ────────────────────────────────────────────────────

  it('renders the Live Zones section heading', () => {
    expect(screen.getByRole('heading', { name: /live zones/i })).toBeInTheDocument();
  });

  it('renders incident items in live zones feed', () => {
    expect(screen.getByText(/medical emergency/i)).toBeInTheDocument();
    expect(screen.getByText(/spill on walkway/i)).toBeInTheDocument();
  });

  it('renders the View All link', () => {
    const link = screen.getByRole('link', { name: /view all stadium zones/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/zones');
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('has a main landmark with role="main"', () => {
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('stats section has an accessible label', () => {
    expect(screen.getByRole('region', { name: /stadium statistics/i })).toBeInTheDocument();
  });

  it('live zones section is labelled by heading', () => {
    const section = screen.getByRole('region', { name: /live zones/i });
    expect(section).toBeInTheDocument();
  });

  it('severity badges have accessible role="status" labels', () => {
    const criticalBadge = screen.getByRole('status', { name: /critical severity/i });
    expect(criticalBadge).toBeInTheDocument();
  });
});
