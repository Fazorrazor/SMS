import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onRetry?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[200px] bg-danger-50/50 rounded-xl border border-danger-100">
                    <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mb-4 text-danger-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary-900 mb-2">Something went wrong</h3>
                    <p className="text-sm text-secondary-500 mb-4 max-w-xs mx-auto">
                        {this.state.error?.message || 'An unexpected error occurred while loading this component.'}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            this.props.onRetry?.();
                        }}
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}


