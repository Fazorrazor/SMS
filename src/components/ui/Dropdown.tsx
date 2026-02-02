import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStickyOverlay } from '../../hooks/useStickyOverlay';

interface DropdownOption {
    label: string;
    value: string;
    icon?: React.ElementType;
}

interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    closeOnSelect?: boolean;
}

export const Dropdown = ({
    options,
    value,
    onChange,
    placeholder = 'Select option',
    className,
    label,
    closeOnSelect = true
}: DropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const coords = useStickyOverlay(triggerRef, isOpen, 8);
    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                // Check if the click was on the portal content
                const portalContent = document.getElementById('dropdown-portal-root');
                if (portalContent && portalContent.contains(event.target as Node)) {
                    return;
                }
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const dropdownMenu = isOpen && createPortal(
        <div
            id="dropdown-portal-root"
            className="fixed z-[100000] bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl ring-1 ring-secondary-200 dark:ring-secondary-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: coords.top,
                left: coords.left,
                width: coords.width
            }}
        >
            <div className="max-h-60 overflow-y-auto py-1">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                            onChange(option.value);
                            if (closeOnSelect) setIsOpen(false);
                        }}
                        className={cn(
                            "flex items-center justify-between w-full px-4 py-3 text-sm font-bold transition-colors",
                            value === option.value
                                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                : "text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800"
                        )}
                    >
                        <div className="flex items-center gap-2 truncate">
                            {option.icon && <option.icon className="w-4 h-4" />}
                            <span className="truncate">{option.label}</span>
                        </div>
                        {value === option.value && <Check className="w-4 h-4 flex-shrink-0" />}
                    </button>
                ))}
            </div>
        </div>,
        document.body
    );

    return (
        <div className={cn("relative", className)} ref={dropdownRef}>
            {label && (
                <label className="block text-xs font-black text-secondary-400 uppercase tracking-widest mb-1.5 ml-1">
                    {label}
                </label>
            )}
            <button
                ref={triggerRef}
                type="button"
                onClick={toggleDropdown}
                className={cn(
                    "flex items-center justify-between w-full px-4 py-2.5 bg-white dark:bg-secondary-900 ring-1 ring-secondary-200 dark:ring-secondary-800 rounded-xl font-bold text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all text-sm outline-none focus:ring-2 focus:ring-primary-500/50",
                    isOpen && "ring-2 ring-primary-500/50"
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && <selectedOption.icon className="w-4 h-4" />}
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 flex-shrink-0 ml-2", isOpen && "rotate-180")} />
            </button>

            {dropdownMenu}
        </div>
    );
};


