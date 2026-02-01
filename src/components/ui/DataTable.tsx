import React from 'react';
import { cn } from '../../lib/utils';

interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    pageSize?: number;
    showPagination?: boolean;
    renderMobileCard?: (item: T) => React.ReactNode;
}

import { ChevronLeft, ChevronRight } from 'lucide-react';

export function DataTable<T>({
    data,
    columns,
    onRowClick,
    isLoading,
    emptyMessage = "No data available",
    pageSize = 10,
    showPagination = false,
    renderMobileCard
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = React.useState(1);

    if (isLoading) {
        return (
            <div className="w-full h-48 flex items-center justify-center text-secondary-500 dark:text-secondary-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full h-48 flex items-center justify-center text-secondary-500 dark:text-secondary-400 border border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg">
                {emptyMessage}
            </div>
        );
    }

    const totalPages = Math.ceil(data.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = showPagination ? data.slice(startIndex, startIndex + pageSize) : data;

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className={cn(
                "overflow-x-auto rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 shadow-sm",
                renderMobileCard ? "hidden md:block" : "block"
            )}>
                <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-800">
                    <thead className="bg-secondary-50 dark:bg-secondary-800/50">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    scope="col"
                                    className={cn(
                                        "px-4 py-3 text-left text-[9px] font-black text-secondary-400 dark:text-secondary-500 uppercase tracking-[0.15em]",
                                        column.className
                                    )}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                        {paginatedData.map((item, rowIndex) => (
                            <tr
                                key={rowIndex}
                                onClick={() => onRowClick?.(item)}
                                className={cn(
                                    "transition-colors hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50",
                                    onRowClick && "cursor-pointer"
                                )}
                            >
                                {columns.map((column, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={cn(
                                            "px-4 py-3 whitespace-nowrap text-xs text-secondary-900 dark:text-secondary-100",
                                            column.className
                                        )}
                                    >
                                        {column.cell
                                            ? column.cell(item)
                                            : column.accessorKey
                                                ? String(item[column.accessorKey])
                                                : null
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            {renderMobileCard && (
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {paginatedData.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => onRowClick?.(item)}
                            className={cn(
                                "bg-white dark:bg-secondary-900 rounded-2xl p-4 ring-1 ring-secondary-200 dark:ring-secondary-800 shadow-sm active:scale-[0.98] transition-all",
                                onRowClick && "cursor-pointer"
                            )}
                        >
                            {renderMobileCard(item)}
                        </div>
                    ))}
                </div>
            )}

            {showPagination && totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs font-bold text-secondary-400 uppercase tracking-wider">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-secondary-200 dark:border-secondary-800 text-secondary-600 dark:text-secondary-400 disabled:opacity-30 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-secondary-200 dark:border-secondary-800 text-secondary-600 dark:text-secondary-400 disabled:opacity-30 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
