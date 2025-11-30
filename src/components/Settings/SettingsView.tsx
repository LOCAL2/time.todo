import { Settings, Moon, Sun, User } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';

export function SettingsView() {
    const { theme, setTheme, session } = useStore();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto p-8 animate-fade-in">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
                            <p className="text-slate-600 dark:text-slate-400">Manage your preferences</p>
                        </div>
                    </div>


                </div>

                {/* Settings Content */}
                <div className="space-y-6">
                    {/* Appearance */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            {theme === 'dark' ? (
                                <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            ) : (
                                <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            )}
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setTheme('dark')}
                                className={`p-4 rounded-lg border-2 transition-all ${theme === 'dark'
                                        ? 'border-blue-600 bg-blue-600/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center">
                                        <Moon className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Dark</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-500">Dark theme</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setTheme('light')}
                                className={`p-4 rounded-lg border-2 transition-all ${theme === 'light'
                                        ? 'border-blue-600 bg-blue-600/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                        <Sun className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Light</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-500">Light theme</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Account */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Account</h2>
                        </div>

                        <div className="space-y-4">
                            {session && (
                                <>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                        {session.user.user_metadata.avatar_url ? (
                                            <img
                                                src={session.user.user_metadata.avatar_url}
                                                alt="Avatar"
                                                className="w-12 h-12 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                                {session.user.user_metadata.full_name || 'User'}
                                            </p>
                                            <p className="text-xs text-slate-600 dark:text-slate-500">
                                                {session.user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 hover:border-red-600/30 text-red-400 rounded-lg font-medium transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
