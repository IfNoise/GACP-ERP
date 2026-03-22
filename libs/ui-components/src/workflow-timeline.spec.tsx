import { render, screen } from '@testing-library/react';
import { WorkflowTimeline } from './workflow-timeline';

const steps = [
  { id: '1', label: 'Draft', status: 'completed' as const, timestamp: '2024-01-01' },
  { id: '2', label: 'Review', status: 'active' as const },
  { id: '3', label: 'Approved', status: 'pending' as const },
];

describe('WorkflowTimeline', () => {
  it('renders all step labels', () => {
    render(<WorkflowTimeline steps={steps} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders timestamp when provided', () => {
    render(<WorkflowTimeline steps={steps} />);
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
  });

  it('shows checkmark for completed steps', () => {
    const { container } = render(<WorkflowTimeline steps={steps} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('shows step number for non-completed steps', () => {
    render(<WorkflowTimeline steps={steps} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<WorkflowTimeline steps={steps} className="my-tl" />);
    expect(container.firstChild).toHaveClass('my-tl');
  });
});
