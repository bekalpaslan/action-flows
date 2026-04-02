import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-md border border-border bg-[rgba(138,138,138,0.24)] text-text placeholder:text-text-muted transition-colors file:border-0 file:bg-transparent file:text-body file:font-semibold focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-glow-focus disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      inputSize: {
        sm: 'h-8 px-3 text-caption',
        md: 'h-10 px-3 text-body',
        lg: 'h-12 px-3 text-body',
      },
      error: {
        true: 'border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_18px_rgba(214,133,2,0.25),0_0_4px_rgba(214,133,2,0.30)]',
        false: '',
      },
    },
    defaultVariants: {
      inputSize: 'md',
      error: false,
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ inputSize, error, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
