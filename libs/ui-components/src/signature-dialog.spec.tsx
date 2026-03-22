import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignatureDialog } from './signature-dialog';

describe('SignatureDialog', () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(
      <SignatureDialog open={false} onClose={onClose} onConfirm={onConfirm} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog when open', () => {
    render(<SignatureDialog open={true} onClose={onClose} onConfirm={onConfirm} />);
    expect(screen.getByText('Electronic Signature')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<SignatureDialog open={true} onClose={onClose} onConfirm={onConfirm} title="Approve" />);
    expect(screen.getByText('Approve')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    render(<SignatureDialog open={true} onClose={onClose} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submit button disabled when fields empty', () => {
    render(<SignatureDialog open={true} onClose={onClose} onConfirm={onConfirm} />);
    const submit = screen.getByText('Sign & Confirm');
    expect(submit).toBeDisabled();
  });

  it('calls onConfirm with password and reason on submit', async () => {
    render(<SignatureDialog open={true} onClose={onClose} onConfirm={onConfirm} />);

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Enter your password'), 'secret123');
    await user.type(screen.getByPlaceholderText(/Approve change control/), 'Approve test');

    await user.click(screen.getByText('Sign & Confirm'));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('secret123', 'Approve test');
    });
  });

  it('shows Signing... when isSubmitting is true', () => {
    render(
      <SignatureDialog open={true} onClose={onClose} onConfirm={onConfirm} isSubmitting={true} />,
    );
    expect(screen.getByText('Signing...')).toBeInTheDocument();
  });
});
