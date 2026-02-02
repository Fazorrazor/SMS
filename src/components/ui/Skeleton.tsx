import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

export const Skeleton = ({
    className,
    variant = 'rounded',
    ...props
}: SkeletonProps) => {
    return (
        <div
            className={cn(
                'animate-pulse bg-secondary-200 dark:bg-secondary-800',
                {
                    'h-4 w-full': variant === 'text',
                    'rounded-full': variant === 'circular',
                    'rounded-md': variant === 'rounded',
                    'rounded-none': variant === 'rectangular' },
                className
            )}
            {...props}
        />
    );
};


