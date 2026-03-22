import { render, screen } from '@testing-library/react';
import { KPICard } from './kpi-card';

describe('KPICard', () => {
  it('renders title and value', () => {
    render(<KPICard title="Active Plants" value={42} />);
    expect(screen.getByText('Active Plants')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<KPICard title="Score" value="98.5%" />);
    expect(screen.getByText('98.5%')).toBeInTheDocument();
  });

  it('renders positive trend', () => {
    render(<KPICard title="Score" value={85} trend={{ value: 5, label: 'vs last week' }} />);
    expect(screen.getByText(/5%/)).toBeInTheDocument();
    expect(screen.getByText('vs last week')).toBeInTheDocument();
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it('renders negative trend', () => {
    render(<KPICard title="Tasks" value={10} trend={{ value: -3, label: 'vs yesterday' }} />);
    expect(screen.getByText(/3%/)).toBeInTheDocument();
    expect(screen.getByText(/↓/)).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<KPICard title="Plants" value={100} icon={<span data-testid="icon">🌱</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('does not render trend section when not provided', () => {
    const { container } = render(<KPICard title="X" value={1} />);
    expect(container.querySelector('.mt-3')).toBeNull();
  });
});
