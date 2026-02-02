import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Lock, User, AlertCircle } from 'lucide-react';

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/settings`);
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await login(username, password);
            if (success) {
                navigate('/dashboard');
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError('An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-200/30 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary-200/30 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md relative animate-in zoom-in-95 duration-500">
                {/* Logo Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-[2rem] shadow-2xl shadow-primary-600/30 mb-6 rotate-12 hover:rotate-0 transition-all duration-500 group">
                        <Lock className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <h1 className="text-4xl font-black text-secondary-900 dark:text-secondary-50 tracking-tight">
                        {settings?.storeName || 'SMS Admin'}
                    </h1>
                    <p className="text-secondary-500 dark:text-secondary-400 font-bold uppercase tracking-widest text-xs mt-2">
                        Inventory Management System
                    </p>
                </div>

                <Card padding="lg" className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-secondary-200/50 dark:ring-secondary-800 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl rounded-[2.5rem]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-100 dark:border-danger-900/50 rounded-2xl flex items-center gap-3 text-danger-600 dark:text-danger-400 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Input
                                label="Username"
                                placeholder="Enter your username"
                                icon={<User className="w-5 h-5" />}
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                                className="h-14 rounded-2xl bg-secondary-50/50 dark:bg-secondary-800/50 border-none ring-1 ring-secondary-200 dark:ring-secondary-700 focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                icon={<Lock className="w-5 h-5" />}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="h-14 rounded-2xl bg-secondary-50/50 dark:bg-secondary-800/50 border-none ring-1 ring-secondary-200 dark:ring-secondary-700 focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-7 text-lg font-black rounded-2xl shadow-xl shadow-primary-600/20 hover:shadow-2xl hover:shadow-primary-600/30 active:scale-[0.98] transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                'Sign In to Dashboard'
                            )}
                        </Button>
                    </form>
                </Card>

                {/* Footer Link */}
                <p className="text-center mt-8 text-secondary-500 dark:text-secondary-400 text-sm font-bold">
                    Forgot password? <span className="text-primary-600 hover:text-primary-500 cursor-pointer">Contact Administrator</span>
                </p>
            </div>
        </div>
    );
};
