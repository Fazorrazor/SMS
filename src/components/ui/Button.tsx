import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20 active:scale-95',
            secondary: 'bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-secondary-50 hover:bg-secondary-200 dark:hover:bg-secondary-700 active:scale-95',
            danger: 'bg-danger-600 text-white hover:bg-danger-700 shadow-lg shadow-danger-600/20 active:scale-95',
            ghost: 'bg-transparent text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-50',
            outline: 'bg-transparent border-2 border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-800 active:scale-95',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-xs font-bold rounded-lg',
            md: 'px-4 py-2.5 text-sm font-bold rounded-xl',
            lg: 'px-6 py-3.5 text-base font-bold rounded-2xl',
            xl: 'px-8 py-4 text-lg font-extrabold rounded-2xl',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-secondary-900 disabled:opacity-50 disabled:pointer-events-none',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading...
                    </>
                ) : (
                    children
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';
