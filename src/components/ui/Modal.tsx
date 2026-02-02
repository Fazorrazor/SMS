import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md'
}: ModalProps) => {
    // Handle Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Prevent scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw] h-[90vh]',
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6 bg-secondary-950/60 backdrop-blur-[2px] animate-in fade-in duration-300 transform-gpu">
            {/* Backdrop Click Area */}
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={cn(
                "relative w-full bg-white dark:bg-secondary-900 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300 max-h-[85vh] ring-1 ring-white/20 dark:ring-secondary-800",
                sizes[size]
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-secondary-100 dark:border-secondary-800 bg-secondary-50/30 dark:bg-secondary-800/30 gap-4">
                    <h2 className="text-xl font-black text-secondary-900 dark:text-secondary-50 tracking-tight truncate min-w-0">{title}</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="rounded-xl w-9 h-9 p-0 hover:bg-white dark:hover:bg-secondary-800 shadow-sm ring-1 ring-secondary-200 dark:ring-secondary-700 hover:ring-secondary-300 dark:hover:ring-secondary-600 transition-all flex-shrink-0"
                    >
                        <X className="w-4 h-4 text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-50" />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-5 bg-secondary-50/50 dark:bg-secondary-800/50 border-t border-secondary-100 dark:border-secondary-800 flex justify-end gap-3 flex-wrap">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

