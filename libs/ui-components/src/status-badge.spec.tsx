import { render, screen } from '@testing-library/react';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('renders with default label for status', () => {
    render(<StatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<StatusBadge status="approved" label="Verified" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it.each([
    ['draft', 'Draft'],
    ['pending', 'Pending'],
    ['approved', 'Approved'],
    ['active', 'Active'],
    ['closed', 'Closed'],
    ['rejected', 'Rejected'],
    ['cancelled', 'Cancelled'],
    ['overdue', 'Overdue'],
  ] as const)('renders %s status with label "%s"', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatusBadge status="active" className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });
});
