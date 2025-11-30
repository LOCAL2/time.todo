import { useEffect, useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import 'cally';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    onClear?: () => void;
    onToday?: () => void;
    label?: string;
}

export function DatePicker({ value, onChange, onClear, onToday, label }: DatePickerProps) {
    const calendarRef = useRef<any>(null);

    useEffect(() => {
        const calendar = calendarRef.current;
        if (!calendar) return;

        // Set initial value
        if (value) {
            calendar.value = value;
        }

        // Listen for changes
        const handleChange = (e: any) => {
            onChange(e.target.value);
        };

        calendar.addEventListener('change', handleChange);

        return () => {
            calendar.removeEventListener('change', handleChange);
        };
    }, [value, onChange]);

    return (
        <div className="relative">
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {label}
                </label>
            )}
            <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-lg rounded-xl overflow-hidden">
                <calendar-date
                    ref={calendarRef}
                    class="cally"
                    value={value}
                >
                    <svg
                        aria-label="Previous"
                        className="fill-current size-4 text-slate-600 dark:text-slate-400"
                        {...({ slot: 'previous' } as any)}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                    >
                        <path fill="currentColor" d="M15.75 19.5 8.25 12l7.5-7.5"></path>
                    </svg>
                    <svg
                        aria-label="Next"
                        className="fill-current size-4 text-slate-600 dark:text-slate-400"
                        {...({ slot: 'next' } as any)}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                    >
                        <path fill="currentColor" d="m8.25 4.5 7.5 7.5-7.5 7.5"></path>
                    </svg>
                    <calendar-month></calendar-month>
                </calendar-date>
                
                {/* Action Buttons */}
                <div className="flex gap-2 p-3 border-t border-slate-200 dark:border-slate-700">
                    {onToday && (
                        <button
                            type="button"
                            onClick={onToday}
                            className="flex-1 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 hover:border-blue-600/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <Calendar className="w-4 h-4" />
                            Today
                        </button>
                    )}
                    {onClear && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
