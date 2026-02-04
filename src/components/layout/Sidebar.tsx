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
import { Button } from '../ui/Button';

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
            <div className="flex flex-col justify-end h-28 flex-shrink-0 px-6 bg-secondary-50 dark:bg-secondary-900 pb-6">
                <div className="flex items-start justify-between w-full">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse ring-2 ring-primary-500/20" />
                            <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.3em]">
                                Enterprise POS
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-secondary-900 dark:text-secondary-50 tracking-tighter leading-none max-w-[180px]">
                            {settings?.storeName ? (
                                <span className="line-clamp-2">{settings.storeName}</span>
                            ) : (
                                <span className="flex flex-col gap-0.5">
                                    <span>Home of</span>
                                    <span className="text-primary-600 dark:text-primary-400">Disposables</span>
                                </span>
                            )}
                        </h1>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 -mr-2 text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-50 transition-colors bg-secondary-200/50 dark:bg-secondary-800 rounded-lg active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 flex flex-col overflow-y-auto py-6">
                <nav className="flex-1 px-4 space-y-1.5">
                    {filteredNavigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            onClick={onClose}
                            className={({ isActive }) => cn(
                                "group flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300",
                                isActive
                                    ? "bg-white dark:bg-secondary-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-700"
                                    : "text-secondary-500 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-800/40 hover:text-secondary-900 dark:hover:text-secondary-50 active:scale-[0.98]"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={cn(
                                        "mr-3.5 h-[1.15rem] w-[1.15rem] flex-shrink-0 transition-colors duration-300",
                                        isActive ? "text-primary-600 dark:text-primary-400" : "text-secondary-400 group-hover:text-secondary-600 dark:group-hover:text-secondary-300"
                                    )} />
                                    <span className="font-bold text-[13px] tracking-wide">{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400 animate-pulse" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* User Profile & Theme Toggle */}
            <div className="p-4 border-t border-secondary-100/50 dark:border-secondary-800/50 space-y-3 flex-shrink-0 bg-secondary-50/50 dark:bg-secondary-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-secondary-800/40 border border-secondary-200/50 dark:border-secondary-700/50 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 font-black text-sm shadow-inner ring-1 ring-primary-500/10">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-secondary-900 dark:text-secondary-50 truncate">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-[10px] font-bold text-secondary-400 dark:text-secondary-500 truncate uppercase tracking-wider mt-0.5">
                            {user?.role || 'Guest'}
                        </p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        type="button"
                        className="p-2.5 rounded-xl text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-50 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-all active:scale-95 active:rotate-12"
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-danger-600 dark:text-danger-400 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20 justify-center h-11 text-xs font-bold rounded-xl border border-transparent hover:border-danger-200 dark:hover:border-danger-900/30 transition-all active:scale-95"
                    onClick={logout}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
};
