import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from './utils';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variantClasses: Record<Variant, string> = {
  default: 'bg-green-700 text-white hover:bg-green-800 focus:ring-green-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'h-9 w-9 p-0',
};

export function buttonVariants(options?: {
  variant?: Variant;
  size?: Size;
  className?: string;
}): string {
  return cn(
    'inline-flex items-center justify-center rounded-lg font-semibold transition',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variantClasses[options?.variant ?? 'default'],
    sizeClasses[options?.size ?? 'md'],
    options?.className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
