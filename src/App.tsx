import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { LoginScreen } from './components/Auth/LoginScreen';
import { PriorityBoardView } from './components/Board/PriorityBoardView';
import { SharedBoardView } from './components/Board/SharedBoardView';
import { SettingsView } from './components/Settings/SettingsView';
import { GuideView } from './components/Guide/GuideView';
import { ToastContainer } from './components/common/Toast';
import { BetaBanner } from './components/common/BetaBanner';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';

function BoardRoute() {
  const { boardId } = useParams();
  const { setActiveBoardId } = useStore();

  useEffect(() => {
    if (boardId) {
      setActiveBoardId(boardId);
    }
  }, [boardId, setActiveBoardId]);

  return <PriorityBoardView />;
}

function GuideRoute() {
  return <GuideView />;
}

function SettingsRoute() {
  const { setActiveView } = useStore();

  useEffect(() => {
    setActiveView('settings');
  }, [setActiveView]);

  return <SettingsView />;
}

function App() {
  const { setSession, session, theme, toasts, removeToast } = useStore();
  const [loading, setLoading] = useState(true);

  // Initialize theme on mount
  useEffect(() => {
    const currentTheme = useStore.getState().theme;
    
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    const unsubscribe = useStore.getState().subscribeToRealtime();

    return () => {
      subscription.unsubscribe();
      unsubscribe();
    };
  }, [setSession]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <>
      <BetaBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={session ? (
            localStorage.getItem('hasSeenGuide') === 'true' 
              ? <Navigate to="/boards" replace />
              : <Navigate to="/guide" replace />
          ) : <LoginScreen />} />
          <Route path="/guide" element={session ? <GuideRoute /> : <Navigate to="/" replace />} />
          <Route path="/boards" element={session ? <Layout><div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">Select a board to view tasks</div></Layout> : <Navigate to="/" replace />} />
          <Route path="/boards/:boardId" element={session ? <Layout><BoardRoute /></Layout> : <Navigate to="/" replace />} />
          <Route path="/settings" element={session ? <Layout><SettingsRoute /></Layout> : <Navigate to="/" replace />} />
          {/* Shared board routes - accessible without login */}
          <Route path="/shared/:boardId" element={<SharedBoardView mode="readonly" />} />
          <Route path="/shared/:boardId/edit" element={<SharedBoardView mode="edit" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

export default App;
