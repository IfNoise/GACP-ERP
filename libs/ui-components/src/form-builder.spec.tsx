import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { FormBuilder, type FieldConfig } from './form-builder';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof schema>;

const fields: FieldConfig<FormData>[] = [
  { name: 'name', label: 'Name', placeholder: 'Enter name' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email' },
];

describe('FormBuilder', () => {
  const onSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all field labels', () => {
    render(<FormBuilder schema={schema} fields={fields} onSubmit={onSubmit} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders submit button with custom label', () => {
    render(<FormBuilder schema={schema} fields={fields} onSubmit={onSubmit} submitLabel="Save" />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('shows Saving... when isSubmitting', () => {
    render(<FormBuilder schema={schema} fields={fields} onSubmit={onSubmit} isSubmitting={true} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    render(<FormBuilder schema={schema} fields={fields} onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid data', async () => {
    render(<FormBuilder schema={schema} fields={fields} onSubmit={onSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Enter name'), 'John');
    await user.type(screen.getByPlaceholderText('Enter email'), 'john@test.com');
    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'John', email: 'john@test.com' }),
      );
    });
  });

  it('renders hidden fields as null', () => {
    const hiddenFields: FieldConfig<FormData>[] = [
      { name: 'name', label: 'Name', hidden: true },
      { name: 'email', label: 'Email' },
    ];
    render(<FormBuilder schema={schema} fields={hiddenFields} onSubmit={onSubmit} />);
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders select field', () => {
    const selectFields: FieldConfig<FormData>[] = [
      {
        name: 'name',
        label: 'Name',
        type: 'select',
        options: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
        ],
      },
      { name: 'email', label: 'Email' },
    ];
    render(<FormBuilder schema={schema} fields={selectFields} onSubmit={onSubmit} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('renders footer content', () => {
    render(
      <FormBuilder
        schema={schema}
        fields={fields}
        onSubmit={onSubmit}
        footer={<button>Cancel</button>}
      />,
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
