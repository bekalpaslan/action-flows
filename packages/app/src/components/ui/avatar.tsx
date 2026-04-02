import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface-2',
  {
    variants: {
      size: {
        sm: 'h-6 w-6 text-[10px]',
        md: 'h-8 w-8 text-caption',
        lg: 'h-10 w-10 text-body',
        xl: 'h-12 w-12 text-body',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt?: string;
  fallback?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, ...props }, ref) => {
    const [imgError, setImgError] = React.useState(false);
    const showImage = src && !imgError;

    const initials = fallback
      ? fallback.slice(0, 2).toUpperCase()
      : alt
        ? alt
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : '?';

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, className }))}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || ''}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-prussian-700 to-prussian-600 font-semibold text-white">
            {initials}
          </span>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

export { Avatar, avatarVariants };
