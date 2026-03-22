import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, type ColumnDef } from './data-table';

interface TestRow {
  id: number;
  name: string;
  status: string;
}

const columns: ColumnDef<TestRow, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
];

const data: TestRow[] = [
  { id: 1, name: 'Alpha', status: 'active' },
  { id: 2, name: 'Beta', status: 'draft' },
  { id: 3, name: 'Gamma', status: 'closed' },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable data={data} columns={columns} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all rows', () => {
    render(<DataTable data={data} columns={columns} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    render(<DataTable data={[]} columns={columns} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('shows default empty message', () => {
    render(<DataTable data={[]} columns={columns} />);
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<DataTable data={data} columns={columns} searchPlaceholder="Find items..." />);
    expect(screen.getByPlaceholderText('Find items...')).toBeInTheDocument();
  });

  it('filters data via global filter', async () => {
    render(<DataTable data={data} columns={columns} />);
    const input = screen.getByPlaceholderText('Search...');
    await userEvent.type(input, 'Alpha');
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });

  it('renders toolbar', () => {
    render(<DataTable data={data} columns={columns} toolbar={<button>Export</button>} />);
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('renders pagination controls', () => {
    render(<DataTable data={data} columns={columns} />);
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('shows result count', () => {
    render(<DataTable data={data} columns={columns} />);
    expect(screen.getByText('3 result(s)')).toBeInTheDocument();
  });
});
