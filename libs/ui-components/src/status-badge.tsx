import { cn } from './utils';
import { Badge } from './badge';

type StatusVariant =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'active'
  | 'closed'
  | 'rejected'
  | 'cancelled'
  | 'overdue';

const statusConfig: Record<
  StatusVariant,
  { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline' }
> = {
  draft: { label: 'Draft', variant: 'default' },
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  active: { label: 'Active', variant: 'info' },
  closed: { label: 'Closed', variant: 'outline' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'default' },
  overdue: { label: 'Overdue', variant: 'destructive' },
};

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={cn('capitalize', className)}>
      {label ?? config.label}
    </Badge>
  );
}

export type { StatusVariant, StatusBadgeProps };
