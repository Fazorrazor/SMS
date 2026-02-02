import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export type UserRole = 'Admin' | 'Cashier';

export interface User {
    id: string;
    name: string;
    username: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    users: User[];
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    addUser: (user: Omit<User, 'id'>) => Promise<void>;
    updateUser: (id: string, data: Partial<User> & { password?: string }) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    refreshUsers: () => Promise<void>;
    isLoading: boolean;
    verifyPassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_URL = `${API_BASE}/api`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users`, {
                headers: { "ngrok-skip-browser-warning": "69420" }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    // Mock initial check
    useEffect(() => {
        const savedUser = localStorage.getItem('sms_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        refreshUsers();
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { "ngrok-skip-browser-warning": "69420", 
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": "69420"
                },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const foundUser = await res.json();
                setUser(foundUser);
                localStorage.setItem('sms_user', JSON.stringify(foundUser));
                toast.success(`Welcome back, ${foundUser.name}!`);
                return true;
            } else {
                toast.error('Invalid username or password');
            }
        } catch (error) {
            console.error('Login failed:', error);
            toast.error('Network error during login');
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('sms_user');
        toast.info('Logged out successfully');
    };

    const addUser = async (userData: Omit<User, 'id'>) => {
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { "ngrok-skip-browser-warning": "69420", 
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": "69420"
                },
                body: JSON.stringify(userData)
            });
            if (res.ok) {
                await refreshUsers();
                toast.success('Staff account created');
            } else {
                toast.error('Failed to create account');
            }
        } catch (error) {
            console.error('Failed to add user:', error);
            toast.error('Network error while creating account');
        }
    };

    const updateUser = async (id: string, data: Partial<User> & { password?: string }) => {
        try {
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'PUT',
                headers: { "ngrok-skip-browser-warning": "69420", 
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": "69420"
                },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                await refreshUsers();

                // If updating self, update local state and storage
                if (user && user.id === id) {
                    const updatedUser = { ...user, ...data };
                    // Remove password from state if it was part of the update data (though it shouldn't be in the User type usually)
                    if ('password' in updatedUser) delete (updatedUser as any).password;

                    setUser(updatedUser as User);
                    localStorage.setItem('sms_user', JSON.stringify(updatedUser));
                }

                toast.success('Staff details updated');
            } else {
                toast.error('Failed to update staff details');
            }
        } catch (error) {
            console.error('Failed to update user:', error);
            toast.error('Network error while updating account');
        }
    };

    const deleteUser = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'DELETE',
                headers: { "ngrok-skip-browser-warning": "69420" }
            });
            if (res.ok) {
                await refreshUsers();
                toast.success('Staff account removed');
            } else {
                toast.error('Failed to remove account');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            toast.error('Network error while removing account');
        }
    };

    const verifyPassword = async (password: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { "ngrok-skip-browser-warning": "69420", 
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": "69420"
                },
                body: JSON.stringify({ username: user.username, password })
            });
            return res.ok;
        } catch (error) {
            console.error('Verification failed:', error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            users,
            login,
            logout,
            addUser,
            updateUser,
            deleteUser,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'Admin',
            refreshUsers,
            isLoading,
            verifyPassword
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};


