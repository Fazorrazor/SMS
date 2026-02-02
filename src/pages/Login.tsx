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
            const apiBase = import.meta.env.VITE_API_URL || '';
            try {
                const res = await fetch(`${apiBase}/api/settings`, {
                    headers: { "ngrok-skip-browser-warning": "69420" }
                });
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
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-primary-600 flex items-center justify-center shadow-2xl shadow-primary-600/20 mb-6">
                        <span className="text-white font-black text-4xl">{settings?.storeName?.charAt(0) || 'H'}</span>
                    </div>
                    <h1 className="text-4xl font-black text-secondary-900 dark:text-secondary-50 tracking-tight truncate max-w-md">{settings?.storeName || 'Home of Disposables'}</h1>
                    <p className="text-secondary-500 dark:text-secondary-400 font-medium mt-2">Sign in to manage your business</p>
                </div>

                <Card padding="lg" className="border-none shadow-2xl ring-1 ring-secondary-200 dark:ring-secondary-800 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl transform-gpu">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-danger-50 border border-danger-100 rounded-2xl flex items-center gap-3 text-danger-600 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-[42px] w-5 h-5 text-secondary-400" />
                                <Input
                                    label="Username"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="pl-12 bg-secondary-50 dark:bg-secondary-800 border-secondary-100 dark:border-secondary-700 text-secondary-900 dark:text-secondary-50 placeholder:text-secondary-400 h-14 rounded-2xl"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-[42px] w-5 h-5 text-secondary-400" />
                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="pl-12 bg-secondary-50 dark:bg-secondary-800 border-secondary-100 dark:border-secondary-700 text-secondary-900 dark:text-secondary-50 placeholder:text-secondary-400 h-14 rounded-2xl"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-secondary-500 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-primary-600 focus:ring-primary-600 focus:ring-offset-white dark:focus:ring-offset-secondary-900" />
                                <span className="font-medium group-hover:text-secondary-900 dark:group-hover:text-secondary-50 transition-colors">Remember me</span>
                            </label>
                            <button type="button" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">
                                Forgot password?
                            </button>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary-600/20"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </Card>

                <p className="text-center mt-8 text-secondary-500 text-sm font-medium">
                    Don't have an account? <button className="text-primary-600 font-black hover:text-primary-700 transition-colors">Contact Admin</button>
                </p>
            </div>
        </div>
    );
};


