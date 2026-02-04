import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, WifiOff } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useProducts } from '../../context/ProductContext';
import { cn } from '../../lib/utils';

export const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isOnline, settings } = useProducts();

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 transition-colors duration-300">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-[90] bg-secondary-900/50 backdrop-blur-sm md:hidden transform-gpu"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-[100] w-72 bg-white dark:bg-secondary-900 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Desktop Sidebar Container */}
            <div className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="md:pl-60 flex flex-col h-screen overflow-hidden overflow-x-hidden">
                {/* Mobile Header */}
                <div className="flex-shrink-0 flex items-center justify-between h-14 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl border-b border-secondary-200 dark:border-secondary-800 md:hidden px-4 z-[60] transform-gpu">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="p-2 -ml-2 text-secondary-500 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors focus:outline-none"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] leading-none mb-0.5">
                                Enterprise POS
                            </span>
                            <h1 className="text-sm font-black text-secondary-900 dark:text-secondary-50 uppercase tracking-tight">
                                {settings?.storeName || 'SalesManager'}
                            </h1>
                        </div>
                    </div>

                    {/* Optional: Add a quick action or profile toggle here for mobile */}
                    <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-bold">
                        {/* User initial */}
                    </div>
                </div>

                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {!isOnline && (
                        <div className="bg-danger-600 text-white px-4 py-2 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
                            <WifiOff className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Offline Mode - Connection lost</span>
                        </div>
                    )}
                    <div className="absolute inset-0 flex flex-col p-4 md:p-8 xl:p-12 overflow-y-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};


