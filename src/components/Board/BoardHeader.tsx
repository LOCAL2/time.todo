import { useState } from 'react';
import { Search, Filter, Share2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ShareBoardModal } from './ShareBoardModal';

export function BoardHeader() {
    const { boards, activeBoardId, searchQuery, setSearchQuery, filterPriority, setFilterPriority } = useStore();
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Get current board
    const currentBoard = boards.find(b => b.id === activeBoardId);

    if (!currentBoard) {
        return null;
    }

    return (
        <>
            <div className="h-14 md:h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 md:px-6 flex items-center justify-end gap-2 md:gap-4">
                {/* Right: Actions - Responsive */}
                <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
                    {/* Share Button */}
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm md:text-base font-medium transition-colors"
                    >
                        <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">แชร์</span>
                    </button>

                    {/* Search - Hidden on mobile, show on tablet+ */}
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-32 lg:w-64 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Filter - Compact on mobile */}
                    <div className="relative">
                        <Filter className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                        <select
                            value={filterPriority || ''}
                            onChange={(e) => setFilterPriority(e.target.value || null)}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-7 md:pl-10 pr-6 md:pr-8 py-1.5 md:py-2 text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                        >
                            <option value="">All</option>
                            <option value="low">Low</option>
                            <option value="medium">Med</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Mobile Search Bar - Show below header on mobile */}
            <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tasks..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            <ShareBoardModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                boardId={currentBoard.id}
                boardTitle={currentBoard.title}
            />
        </>
    );
}
