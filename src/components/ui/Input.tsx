import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, type, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-xs font-bold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors">
                            {icon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            'w-full bg-white dark:bg-secondary-800 border-none ring-1 ring-secondary-200 dark:ring-secondary-700 rounded-xl py-3 px-4 outline-none transition-all duration-200',
                            'focus:ring-2 focus:ring-primary-500 focus:shadow-lg focus:shadow-primary-500/10 dark:focus:ring-offset-secondary-900',
                            'placeholder:text-secondary-400 placeholder:font-medium text-secondary-900 dark:text-secondary-50 font-semibold',
                            icon && 'pl-11',
                            error && 'ring-danger-500 focus:ring-danger-500 dark:ring-danger-400',
                            className
                        )}
                        ref={ref}
                        onWheel={(e) => {
                            if (type === 'number') {
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                        onKeyDown={(e) => {
                            if (type === 'number') {
                                // Prevent 'e', 'E', '+', and '-' in number inputs
                                if (['e', 'E', '+', '-'].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }
                            props.onKeyDown?.(e);
                        }}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs font-bold text-danger-600 ml-1 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';


