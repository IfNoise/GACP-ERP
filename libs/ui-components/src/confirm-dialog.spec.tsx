import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete"
        description="Are you sure?"
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and description when open', () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete Item"
        description="This cannot be undone."
      />,
    );
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('calls onClose when Cancel clicked', async () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="T"
        description="D"
      />,
    );
    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Confirm clicked', async () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="T"
        description="D"
      />,
    );
    await userEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('uses custom labels', () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="T"
        description="D"
        confirmLabel="Yes, delete"
        cancelLabel="No, keep"
      />,
    );
    expect(screen.getByText('Yes, delete')).toBeInTheDocument();
    expect(screen.getByText('No, keep')).toBeInTheDocument();
  });

  it('disables buttons when isSubmitting', () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="T"
        description="D"
        isSubmitting={true}
      />,
    );
    expect(screen.getByText('Processing...')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });
});
