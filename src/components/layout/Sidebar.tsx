import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    ClipboardList,
    BarChart3,
    Users,
    Settings,
    LogOut,
    Sun,
    Moon,
    X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useProducts } from '../../context/ProductContext';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['Admin', 'Cashier'] },
    { name: 'POS Terminal', href: '/pos', icon: ShoppingCart, roles: ['Admin', 'Cashier'] },
    { name: 'Products', href: '/products', icon: Package, roles: ['Admin'] },
    { name: 'Inventory', href: '/inventory', icon: ClipboardList, roles: ['Admin'] },
    { name: 'Sales & Reports', href: '/sales', icon: BarChart3, roles: ['Admin'] },
    { name: 'Staff', href: '/users', icon: Users, roles: ['Admin'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['Admin'] },
];

interface SidebarProps {
    onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { settings } = useProducts();

    const filteredNavigation = navigation.filter(item =>
        user && item.roles.includes(user.role)
    );

    return (
        <div className="flex h-full flex-col bg-secondary-50 dark:bg-secondary-900 border-r border-secondary-200/50 dark:border-secondary-800">
            {/* Logo Section */}
            <div className="flex flex-col justify-center h-32 flex-shrink-0 px-8 bg-secondary-50 dark:bg-secondary-900">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                        <span className="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.4em]">
                            Enterprise POS
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-secondary-900 dark:text-secondary-50 tracking-tighter leading-[1] flex flex-col">
                        {settings?.storeName ? (
                            settings.storeName.split(' ').map((word: string, i: number) => (
                                <span key={i} className={cn(
                                    "truncate",
                                    i % 2 !== 0 ? "text-primary-600 dark:text-primary-400 text-lg opacity-80" : ""
                                )}>
                                    {word}
                                </span>
                            ))
                        ) : (
                            <>
                                <span>Home</span>
                                <span className="text-primary-600 dark:text-primary-400 text-lg opacity-80">of</span>
                                <span>Disposables</span>
                            </>
                        )}
                    </h1>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 -mr-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Navigation Section */}
            <div className="flex-1 flex flex-col overflow-y-auto py-6">
                <nav className="flex-1 px-4 space-y-2">
                    {filteredNavigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            onClick={onClose}
                            className={({ isActive }) => cn(
                                "group flex items-center px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-white dark:bg-secondary-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-secondary-200 dark:ring-secondary-700"
                                    : "text-secondary-500 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-800/50 hover:text-secondary-900 dark:hover:text-secondary-50"
                            )}
                        >
                            <item.icon className={cn(
                                "mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200",
                                "group-hover:text-primary-500"
                            )} />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* User Profile & Theme Toggle */}
            <div className="flex-shrink-0 p-6 bg-secondary-50 dark:bg-secondary-900 border-t border-secondary-200/50 dark:border-secondary-800">
                <div className="flex items-center justify-between mb-6 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-xs">
                            {user?.name.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <p className="text-xs font-black text-secondary-900 dark:text-secondary-50 truncate">{user?.name}</p>
                            <p className="text-[10px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg bg-white dark:bg-secondary-800 text-secondary-500 dark:text-secondary-400 hover:text-primary-500 transition-colors shadow-sm ring-1 ring-secondary-200 dark:ring-secondary-700"
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>
                <button
                    onClick={logout}
                    className="flex w-full items-center px-4 py-2.5 text-sm font-bold text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-xl transition-all duration-200 group"
                >
                    <LogOut className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

