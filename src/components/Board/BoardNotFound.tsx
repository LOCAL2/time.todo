import { useNavigate } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

export function BoardNotFound() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Board Not Found
          </h1>

          {/* Description */}
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            ไม่พบ board ที่คุณกำลังมองหา
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mb-8">
            Board นี้อาจถูกลบไปแล้ว หรือคุณไม่มีสิทธิ์เข้าถึง
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              ย้อนกลับ
            </button>
            <button
              onClick={() => navigate('/boards')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-600/30"
            >
              <Home className="w-4 h-4" />
              หน้าหลัก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
