import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useAuth, type UserRole, type User } from '../context/AuthContext';
import { cn } from '../lib/utils';
import {
    UserPlus,
    Shield,
    User as UserIcon,
    Trash2,
    Mail,
    ShieldCheck,
    ShieldAlert,
    Pencil
} from 'lucide-react';

export const Users = () => {
    const { users, addUser, updateUser, deleteUser, isAdmin } = useAuth();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        role: 'Cashier' as UserRole,
        password: ''
    });

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        addUser({
            name: formData.name,
            username: formData.username,
            role: formData.role
        });
        setIsAddOpen(false);
        setFormData({ name: '', username: '', role: 'Cashier', password: '' });
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            username: user.username,
            role: user.role,
            password: '' // Don't show current password
        });
        setIsEditOpen(true);
    };

    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        const updateData: any = {
            name: formData.name,
            username: formData.username,
            role: formData.role
        };

        if (formData.password) {
            updateData.password = formData.password;
        }

        updateUser(editingUser.id, updateData);
        setIsEditOpen(false);
        setEditingUser(null);
        setFormData({ name: '', username: '', role: 'Cashier', password: '' });
    };

    if (!isAdmin) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-secondary-900 dark:text-secondary-50">Access Denied</h2>
                <p className="text-secondary-500 dark:text-secondary-400 mt-2 max-w-md">You do not have permission to view this page. Please contact your administrator if you believe this is an error.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-secondary-900 dark:text-secondary-50 tracking-tight">Staff Management</h1>
                    <p className="text-secondary-500 dark:text-secondary-400 font-medium mt-1">Manage system users and their access levels.</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ name: '', username: '', role: 'Cashier', password: '' });
                        setIsAddOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 rounded-2xl font-black text-white shadow-xl shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    Add New Staff
                </button>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((u) => (
                    <Card key={u.id} padding="lg" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 hover:ring-primary-500/50 transition-all group relative overflow-hidden bg-white dark:bg-secondary-900">
                        {/* Role Badge Background */}
                        <div className={cn(
                            "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity",
                            u.role === 'Admin' ? "bg-primary-600" : "bg-success-600"
                        )} />

                        <div className="flex items-start justify-between relative">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
                                    u.role === 'Admin' ? "bg-primary-600 shadow-primary-600/20" : "bg-success-600 shadow-success-600/20"
                                )}>
                                    <UserIcon className="w-7 h-7" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-black text-secondary-900 dark:text-secondary-50 text-lg truncate">{u.name}</h3>
                                    <div className="flex items-center gap-1.5 text-secondary-400 dark:text-secondary-500 font-bold text-xs uppercase tracking-wider mt-0.5">
                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">@{u.username}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleEditClick(u)}
                                className="p-2 text-secondary-300 hover:text-primary-600 transition-colors"
                            >
                                <Pencil className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mt-8 flex items-center justify-between">
                            <div className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest",
                                u.role === 'Admin' ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400" : "bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400"
                            )}>
                                {u.role === 'Admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                {u.role}
                            </div>
                            <button
                                onClick={() => deleteUser(u.id)}
                                className="flex items-center gap-2 text-secondary-400 hover:text-danger-600 font-bold text-xs transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Remove
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Add User Modal */}
            <Modal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Add New Staff Member"
                size="sm"
            >
                <form onSubmit={handleAddUser} className="space-y-6">
                    <Input
                        label="Full Name"
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="h-12 rounded-xl"
                    />
                    <Input
                        label="Username"
                        placeholder="e.g. jdoe"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        required
                        className="h-12 rounded-xl"
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-black text-secondary-400 uppercase tracking-widest">Access Level</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['Cashier', 'Admin'] as UserRole[]).map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role })}
                                    className={cn(
                                        "flex items-center justify-center gap-2 p-4 rounded-2xl border-2 font-bold transition-all",
                                        formData.role === role
                                            ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                            : "border-secondary-100 dark:border-secondary-800 hover:border-secondary-200 dark:hover:border-secondary-700 text-secondary-500 dark:text-secondary-400"
                                    )}
                                >
                                    {role === 'Admin' ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button variant="ghost" className="flex-1" type="button" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button className="flex-1" type="submit">Create Account</Button>
                    </div>
                </form>
            </Modal>

            {/* Edit User Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Staff Member"
                size="sm"
            >
                <form onSubmit={handleUpdateUser} className="space-y-6">
                    <Input
                        label="Full Name"
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="h-12 rounded-xl"
                    />
                    <Input
                        label="Username"
                        placeholder="e.g. jdoe"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        required
                        className="h-12 rounded-xl"
                    />
                    <Input
                        label="New Password (Optional)"
                        placeholder="Leave blank to keep current"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="h-12 rounded-xl"
                        type="password"
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-black text-secondary-400 uppercase tracking-widest">Access Level</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['Cashier', 'Admin'] as UserRole[]).map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role })}
                                    className={cn(
                                        "flex items-center justify-center gap-2 p-4 rounded-2xl border-2 font-bold transition-all",
                                        formData.role === role
                                            ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                            : "border-secondary-100 dark:border-secondary-800 hover:border-secondary-200 dark:hover:border-secondary-700 text-secondary-500 dark:text-secondary-400"
                                    )}
                                >
                                    {role === 'Admin' ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button variant="ghost" className="flex-1" type="button" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button className="flex-1" type="submit">Save Changes</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

