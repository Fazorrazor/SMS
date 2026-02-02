import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import {
    Bell,
    Lock,
    Globe,
    Database,
    Store,
    Save,
    Download,
    Upload,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Dropdown } from '../components/ui/Dropdown';

type SettingsTab = 'General' | 'Notifications' | 'Security' | 'Localization' | 'Backup';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_URL = `${API_BASE}/api`;

export const Settings = () => {
    const { user, isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('General');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (!isAdmin) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-secondary-900 dark:text-secondary-50">Access Denied</h2>
                <p className="text-secondary-500 dark:text-secondary-400 mt-2 max-w-md">You do not have permission to view this page. Please contact your administrator if you believe this is an error.</p>
            </div>
        );
    }

    // Settings State
    const [settings, setSettings] = useState({
        storeName: '',
        storeEmail: '',
        storePhone: '',
        storeAddress: '',
        currencySymbol: '',
        taxRate: '',
        language: 'English (US)',
        timezone: '(GMT-05:00) Eastern Time',
        dateFormat: 'MM/DD/YYYY',
        lowStockAlerts: true,
        dailySummary: false,
        staffLoginAlerts: true,
        systemUpdates: true,
        revenueGoal: '50000',
        lowStockThreshold: '5'
    });

    // Password State
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/settings`, {
                headers: { "ngrok-skip-browser-warning": "69420" }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings({
                    ...data,
                    lowStockAlerts: data.lowStockAlerts === 'true',
                    dailySummary: data.dailySummary === 'true',
                    staffLoginAlerts: data.staffLoginAlerts === 'true',
                    systemUpdates: data.systemUpdates === 'true',
                    revenueGoal: data.revenueGoal || '50000',
                    lowStockThreshold: data.lowStockThreshold || '5'
                });
            }
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: {
                    "ngrok-skip-browser-warning": "69420",
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                toast.success('Settings updated successfully');
            } else {
                toast.error('Failed to save settings');
            }
        } catch (error) {
            toast.error('Network error while saving settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toast.error('New passwords do not match');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/change-password`, {
                method: 'POST',
                headers: { "ngrok-skip-browser-warning": "69420", 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                })
            });
            if (res.ok) {
                toast.success('Password changed successfully');
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to change password');
            }
        } catch (error) {
            toast.error('Network error during password change');
        }
    };

    const handleBackup = () => {
        window.location.href = `${API_URL}/backup`;
        toast.success('Backup download started');
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('database', file);

        try {
            const res = await fetch(`${API_URL}/restore`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                toast.success('Database restored! Please restart the server.');
            } else {
                toast.error('Failed to restore database');
            }
        } catch (error) {
            toast.error('Network error during restore');
        }
    };

    const tabs = [
        { id: 'General' as SettingsTab, icon: Store, label: 'General' },
        { id: 'Notifications' as SettingsTab, icon: Bell, label: 'Notifications' },
        { id: 'Security' as SettingsTab, icon: Lock, label: 'Security' },
        { id: 'Localization' as SettingsTab, icon: Globe, label: 'Localization' },
        { id: 'Backup' as SettingsTab, icon: Database, label: 'Backup & Sync' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-700 h-full overflow-hidden">
            <header className="flex-shrink-0">
                <h1 className="text-3xl font-black text-secondary-900 dark:text-secondary-50 tracking-tight">Settings</h1>
                <p className="text-base font-medium text-secondary-500 dark:text-secondary-400 mt-1">Manage your system preferences and account security.</p>
            </header>

            <Card padding="none" className="border border-secondary-200 dark:border-secondary-800 shadow-xl shadow-secondary-200/20 bg-white dark:bg-secondary-900 overflow-hidden rounded-[2rem] flex flex-col md:flex-row flex-1 min-h-0">
                {/* Unified Sidebar - Horizontal on Mobile, Vertical on Desktop */}
                <div className="w-full md:w-72 bg-secondary-50/80 dark:bg-secondary-800/80 border-b md:border-b-0 md:border-r border-secondary-200 dark:border-secondary-800 p-4 md:p-6 flex-shrink-0">
                    <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 text-sm whitespace-nowrap flex-shrink-0 md:flex-shrink",
                                    activeTab === tab.id
                                        ? "bg-white dark:bg-secondary-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-secondary-200 dark:ring-secondary-700"
                                        : "text-secondary-500 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-50 hover:bg-white/50 dark:hover:bg-secondary-800/50"
                                )}
                            >
                                <tab.icon className={cn("w-5 h-5 flex-shrink-0", activeTab === tab.id ? "text-primary-600 dark:text-primary-400" : "text-secondary-400 dark:text-secondary-500")} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Unified Content Area - Scrollable */}
                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-secondary-900">
                    <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                        <div className="max-w-3xl">
                            {activeTab === 'General' && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-secondary-900 dark:text-secondary-50 truncate">Store Information</h3>
                                        <p className="text-secondary-500 dark:text-secondary-400 font-medium">Basic details about your business profile.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <Input
                                            label="Store Name"
                                            value={settings.storeName}
                                            onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                                            placeholder="Enter store name"
                                        />
                                        <Input
                                            label="Store Email"
                                            value={settings.storeEmail}
                                            onChange={e => setSettings({ ...settings, storeEmail: e.target.value })}
                                            placeholder="Enter store email"
                                        />
                                        <Input
                                            label="Phone Number"
                                            value={settings.storePhone}
                                            onChange={e => setSettings({ ...settings, storePhone: e.target.value })}
                                            placeholder="Enter phone number"
                                        />
                                        <Input
                                            label="Currency Symbol"
                                            value={settings.currencySymbol}
                                            onChange={e => setSettings({ ...settings, currencySymbol: e.target.value })}
                                            placeholder="e.g. $, £, €"
                                        />
                                        <Input
                                            label="Monthly Revenue Goal"
                                            type="number"
                                            value={settings.revenueGoal}
                                            onChange={e => setSettings({ ...settings, revenueGoal: e.target.value })}
                                            placeholder="e.g. 50000"
                                        />
                                        <Input
                                            label="Low Stock Threshold"
                                            type="number"
                                            value={settings.lowStockThreshold}
                                            onChange={e => setSettings({ ...settings, lowStockThreshold: e.target.value })}
                                            placeholder="e.g. 5"
                                        />
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Store Address"
                                                value={settings.storeAddress}
                                                onChange={e => setSettings({ ...settings, storeAddress: e.target.value })}
                                                placeholder="Enter full address"
                                            />
                                        </div>
                                        <Input
                                            label="Default Tax Rate (%)"
                                            value={settings.taxRate}
                                            onChange={e => setSettings({ ...settings, taxRate: e.target.value })}
                                            placeholder="e.g. 5.0"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Notifications' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3 pb-6 border-b border-secondary-100 dark:border-secondary-800">
                                        <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center text-warning-600 dark:text-warning-400">
                                            <Bell className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-secondary-900 dark:text-secondary-50">Alert Preferences</h3>
                                            <p className="text-sm font-medium text-secondary-400 dark:text-secondary-500">Manage how you receive system alerts.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { key: 'lowStockAlerts', title: 'Low Stock Alerts', desc: 'Notify when a product falls below the threshold.' },
                                            { key: 'dailySummary', title: 'Daily Sales Summary', desc: 'Receive a summary of daily transactions every evening.' },
                                            { key: 'staffLoginAlerts', title: 'New Staff Login', desc: 'Alert when a new staff member logs in from a new device.' },
                                            { key: 'systemUpdates', title: 'System Updates', desc: 'Get notified about new features and security patches.' },
                                        ].map((item) => (
                                            <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-secondary-50/50 dark:bg-secondary-800/50 ring-1 ring-secondary-100 dark:ring-secondary-800 gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-secondary-900 dark:text-secondary-50 truncate">{item.title}</p>
                                                    <p className="text-xs font-medium text-secondary-400 dark:text-secondary-500 mt-0.5 line-clamp-2">{item.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                                                    className={cn(
                                                        "w-11 h-6 rounded-full transition-all relative flex-shrink-0",
                                                        settings[item.key as keyof typeof settings] ? "bg-primary-600" : "bg-secondary-200 dark:bg-secondary-700"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                                        settings[item.key as keyof typeof settings] ? "left-6" : "left-1"
                                                    )} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Security' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3 pb-6 border-b border-secondary-100 dark:border-secondary-800">
                                        <div className="w-10 h-10 rounded-xl bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center text-danger-600 dark:text-danger-400">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-secondary-900 dark:text-secondary-50">Security & Access</h3>
                                            <p className="text-sm font-medium text-secondary-400 dark:text-secondary-500">Protect your account and system data.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handlePasswordChange} className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6 max-w-md">
                                            <Input
                                                label="Current Password"
                                                type="password"
                                                value={passwords.current}
                                                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                                placeholder="••••••••"
                                                required
                                            />
                                            <Input
                                                label="New Password"
                                                type="password"
                                                value={passwords.new}
                                                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                                placeholder="••••••••"
                                                required
                                            />
                                            <Input
                                                label="Confirm New Password"
                                                type="password"
                                                value={passwords.confirm}
                                                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                        <Button type="submit">Update Password</Button>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'Localization' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3 pb-6 border-b border-secondary-100 dark:border-secondary-800">
                                        <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-900/20 flex items-center justify-center text-success-600 dark:text-success-400">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-secondary-900 dark:text-secondary-50">Regional Settings</h3>
                                            <p className="text-sm font-medium text-secondary-400 dark:text-secondary-500">Set your language, time zone, and formats.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <Dropdown
                                            label="Language"
                                            value={settings.language}
                                            onChange={val => setSettings({ ...settings, language: val })}
                                            options={[
                                                { label: 'English (US)', value: 'English (US)', icon: Globe },
                                                { label: 'Spanish', value: 'Spanish', icon: Globe },
                                                { label: 'French', value: 'French', icon: Globe },
                                            ]}
                                            className="w-full"
                                        />
                                        <Dropdown
                                            label="Time Zone"
                                            value={settings.timezone}
                                            onChange={val => setSettings({ ...settings, timezone: val })}
                                            options={[
                                                { label: '(GMT-05:00) Eastern Time', value: '(GMT-05:00) Eastern Time', icon: Globe },
                                                { label: '(GMT-08:00) Pacific Time', value: '(GMT-08:00) Pacific Time', icon: Globe },
                                                { label: '(GMT+00:00) UTC', value: '(GMT+00:00) UTC', icon: Globe },
                                            ]}
                                            className="w-full"
                                        />
                                        <Dropdown
                                            label="Date Format"
                                            value={settings.dateFormat}
                                            onChange={val => setSettings({ ...settings, dateFormat: val })}
                                            options={[
                                                { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY', icon: Globe },
                                                { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY', icon: Globe },
                                                { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD', icon: Globe },
                                            ]}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Backup' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3 pb-6 border-b border-secondary-100 dark:border-secondary-800">
                                        <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-secondary-600 dark:text-secondary-400">
                                            <Database className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-secondary-900 dark:text-secondary-50">Backup & Recovery</h3>
                                            <p className="text-sm font-medium text-secondary-400 dark:text-secondary-500">Manage your database and system snapshots.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card
                                            padding="md"
                                            onClick={handleBackup}
                                            className="bg-secondary-50/50 dark:bg-secondary-800/50 border-dashed border-2 border-secondary-200 dark:border-secondary-700 flex flex-col items-center text-center group hover:border-primary-400 transition-all cursor-pointer"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-secondary-900 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Download className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <h4 className="font-black text-secondary-900 dark:text-secondary-50">Export Database</h4>
                                            <p className="text-xs font-medium text-secondary-400 dark:text-secondary-500 mt-2">Download a full snapshot of your products, sales, and users as a .sqlite file.</p>
                                            <Button variant="ghost" className="mt-6 text-xs pointer-events-none">Download Backup</Button>
                                        </Card>

                                        <label className="bg-secondary-50/50 dark:bg-secondary-800/50 border-dashed border-2 border-secondary-200 dark:border-secondary-700 rounded-2xl p-6 flex flex-col items-center text-center group hover:border-warning-400 transition-all cursor-pointer">
                                            <input type="file" className="hidden" accept=".sqlite" onChange={handleRestore} />
                                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-secondary-900 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Upload className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                                            </div>
                                            <h4 className="font-black text-secondary-900 dark:text-secondary-50">Restore Data</h4>
                                            <p className="text-xs font-medium text-secondary-400 dark:text-secondary-500 mt-2">Upload a previously exported .sqlite file to restore your system state.</p>
                                            <div className="mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-medium bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors">
                                                Upload & Restore
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Global Footer - Fixed at bottom of card */}
                    <div className="flex-shrink-0 p-6 border-t border-secondary-100 dark:border-secondary-800 bg-secondary-50/30 dark:bg-secondary-800/30 flex justify-end gap-3 rounded-br-[2rem]">
                        <Button variant="ghost" onClick={fetchSettings} className="dark:text-secondary-400 dark:hover:text-secondary-200">Reset Changes</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="px-8">
                            {isSaving ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Save Settings
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};



