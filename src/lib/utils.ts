import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
    }).format(amount);
}
export function formatStock(stock: number, unit: string = 'Pack') {
    const full = Math.floor(stock);
    const fraction = stock - full;

    let fractionText = '';
    if (fraction === 0.75) fractionText = '3/4';
    else if (fraction === 0.5) fractionText = '1/2';
    else if (fraction === 0.25) fractionText = '1/4';
    else if (fraction > 0) fractionText = fraction.toFixed(2).replace('0.', '');

    if (full === 0 && fractionText) return `${fractionText} ${unit}`;
    if (fractionText) return `${full} Full & ${fractionText} ${unit}s`;
    return `${full} ${unit}${full !== 1 ? 's' : ''}`;
}
