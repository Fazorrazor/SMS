
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">SMS</span>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-secondary-900 dark:text-secondary-50">
                    Sales Management System
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-secondary-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-secondary-200 dark:border-secondary-800">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};
