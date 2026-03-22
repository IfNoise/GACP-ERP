'use client';

import { useForm, type DefaultValues, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodObject, ZodRawShape } from 'zod';
import { cn } from './utils';
import { Button } from './button';

type FieldConfig<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'date' | 'checkbox';
  placeholder?: string;
  options?: { label: string; value: string }[];
  className?: string;
  hidden?: boolean;
  disabled?: boolean;
};

interface FormBuilderProps<T extends FieldValues> {
  schema: ZodObject<ZodRawShape>;
  fields: FieldConfig<T>[];
  onSubmit: (data: T) => void | Promise<void>;
  defaultValues?: DefaultValues<T>;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
  footer?: React.ReactNode;
}

export function FormBuilder<T extends FieldValues>({
  schema,
  fields,
  onSubmit,
  defaultValues,
  submitLabel = 'Submit',
  isSubmitting = false,
  className,
  footer,
}: FormBuilderProps<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as Record<string, unknown>,
  });

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data as T))}
      className={cn('space-y-4', className)}
      noValidate
    >
      {fields.map((field) => {
        if (field.hidden) return null;

        const error = errors[field.name];
        const errorMessage = error?.message as string | undefined;

        return (
          <div key={String(field.name)} className={cn('space-y-1.5', field.className)}>
            {field.type !== 'checkbox' && (
              <label
                htmlFor={String(field.name)}
                className="block text-sm font-medium text-gray-700"
              >
                {field.label}
              </label>
            )}

            {field.type === 'textarea' ? (
              <textarea
                id={String(field.name)}
                {...register(field.name)}
                placeholder={field.placeholder}
                disabled={field.disabled}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm transition',
                  'focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500',
                  'disabled:cursor-not-allowed disabled:bg-gray-50',
                  error ? 'border-red-300' : 'border-gray-300',
                )}
                rows={3}
              />
            ) : field.type === 'select' ? (
              <select
                id={String(field.name)}
                {...register(field.name)}
                disabled={field.disabled}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm transition',
                  'focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500',
                  'disabled:cursor-not-allowed disabled:bg-gray-50',
                  error ? 'border-red-300' : 'border-gray-300',
                )}
              >
                <option value="">{field.placeholder ?? 'Select...'}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <label className="flex items-center gap-2">
                <input
                  id={String(field.name)}
                  type="checkbox"
                  {...register(field.name)}
                  disabled={field.disabled}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{field.label}</span>
              </label>
            ) : (
              <input
                id={String(field.name)}
                type={field.type ?? 'text'}
                {...register(field.name)}
                placeholder={field.placeholder}
                disabled={field.disabled}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm transition',
                  'focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500',
                  'disabled:cursor-not-allowed disabled:bg-gray-50',
                  error ? 'border-red-300' : 'border-gray-300',
                )}
              />
            )}

            {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
          </div>
        );
      })}

      <div className="flex items-center justify-end gap-3 pt-2">
        {footer}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export type { FieldConfig, FormBuilderProps };
