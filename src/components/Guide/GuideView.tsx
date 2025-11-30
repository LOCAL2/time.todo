import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, BookOpen, ArrowUp } from 'lucide-react';

export function GuideView() {
    const navigate = useNavigate();
    const [showButtons, setShowButtons] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;

            // Clear previous timeout
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            // Debounce scroll detection
            scrollTimeoutRef.current = window.setTimeout(() => {
                if (!contentRef.current) return;

                const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
                // Increase threshold to 150px to prevent flickering
                const atBottom = scrollTop + clientHeight >= scrollHeight - 150;

                if (atBottom && !showButtons) {
                    setShowButtons(true);
                }
            }, 200); // 200ms debounce
        };

        const ref = contentRef.current;
        ref?.addEventListener('scroll', handleScroll);

        return () => {
            ref?.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [showButtons]);

    const handleUnderstand = () => {
        localStorage.setItem('hasSeenGuide', 'true');
        navigate('/boards');
    };

    const handleNotUnderstand = () => {
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setShowButtons(false);
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            คู่มือการใช้งาน Priority Queue Board
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            เรียนรู้วิธีใช้งานระบบจัดการงานแบบ Priority Queue
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto flex justify-center">
                <div className="w-full max-w-7xl p-8 space-y-8">
                    {/* Section 1: Introduction */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                            Priority Queue Board คืออะไร?
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                            Priority Queue Board เป็นระบบจัดการงานที่ช่วยให้คุณจัดลำดับความสำคัญของงานได้อย่างมีประสิทธิภาพ
                            โดยแบ่งงานออกเป็น 3 ส่วนหลัก:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">📋 Backlog</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    งานทั้งหมดที่รอการจัดลำดับ
                                </p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                                <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">🎯 Priority Queue</h3>
                                <p className="text-sm text-blue-700 dark:text-blue-400">
                                    งานที่จัดลำดับความสำคัญแล้ว
                                </p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                                <h3 className="font-bold text-green-900 dark:text-green-300 mb-2">✅ Completed</h3>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    งานที่เสร็จสิ้นแล้ว
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Creating Tasks */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                            การสร้างงานใหม่
                        </h2>
                        <ol className="space-y-4">
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">คลิกปุ่ม "+ Add Task"</h3>
                                    <p className="text-slate-600 dark:text-slate-400">ที่ด้านล่างของคอลัมน์ Backlog</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">กรอกข้อมูลงาน</h3>
                                    <ul className="text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1">
                                        <li>ชื่องาน (จำเป็น)</li>
                                        <li>รายละเอียด (ถ้ามี)</li>
                                        <li>ระดับความสำคัญ: Low, Medium, High</li>
                                        <li>วันครบกำหนด</li>
                                        <li>รูปภาพประกอบ (ลาก & วาง หรือคลิกเลือก)</li>
                                    </ul>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">คลิก "Create Task"</h3>
                                    <p className="text-slate-600 dark:text-slate-400">งานจะถูกเพิ่มเข้า Backlog ทันที</p>
                                </div>
                            </li>
                        </ol>
                    </section>

                    {/* Section 3: Priority Queue */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                            การจัดลำดับความสำคัญ
                        </h2>
                        <div className="space-y-4">
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Priority Queue ใช้หลักการ "งานที่อยู่บนสุดคือสำคัญที่สุด" คุณสามารถ:
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                                <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">วิธีจัดลำดับ:</h3>
                                <ol className="space-y-2 text-blue-800 dark:text-blue-400">
                                    <li>1. <strong>ลาก</strong>งานจาก Backlog มาวางใน Priority Queue</li>
                                    <li>2. <strong>เรียงลำดับ</strong>โดยลากงานขึ้น-ลง ภายใน Priority Queue</li>
                                    <li>3. งานที่อยู่<strong>บนสุด (เลข 1)</strong> คือสำคัญที่สุด</li>
                                    <li>4. ทำงานตามลำดับจากบนลงล่าง</li>
                                </ol>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Managing Tasks */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                            การจัดการงาน
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">👁️ ดูรายละเอียด</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    คลิกที่การ์ดงานเพื่อดูข้อมูลเต็ม รูปภาพ และรายละเอียดทั้งหมด
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">✏️ แก้ไขงาน</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Hover ที่การ์ดแล้วคลิกปุ่มดินสอสีน้ำเงิน
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">🗑️ ลบงาน</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Hover ที่การ์ดแล้วคลิกปุ่มถังขยะสีแดง
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">✅ ทำเครื่องหมายเสร็จ</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    ลากงานไปวางใน Completed หรือคลิกปุ่มถูกสีเขียว
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Search & Filter */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                            การค้นหาและกรอง
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">🔍</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">ค้นหางาน</h3>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        พิมพ์ในช่อง Search ที่มุมขวาบนเพื่อค้นหาจากชื่อหรือรายละเอียดงาน
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">⚙️</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">กรองตามความสำคัญ</h3>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        เลือก Priority filter เพื่อแสดงเฉพาะงานที่มีระดับความสำคัญที่ต้องการ
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 6: Tips */}
                    <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl p-8 shadow-lg border border-blue-200 dark:border-blue-900">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                            เคล็ดลับการใช้งาน
                        </h2>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">1</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300">
                                    <strong>จัดลำดับทุกเช้า:</strong> ใช้เวลา 5 นาทีเพื่อจัดลำดับงานสำคัญของวัน
                                </p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">2</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300">
                                    <strong>ทำงานตามลำดับ:</strong> เริ่มจากงานเลข 1 เสมอ อย่ากระโดดข้าม
                                </p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">3</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300">
                                    <strong>แนบรูปภาพ:</strong> ใช้รูปภาพช่วยให้เข้าใจงานได้ชัดเจนขึ้น
                                </p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">4</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300">
                                    <strong>Review ทุกวัน:</strong> ย้ายงานที่เสร็จไป Completed และเพิ่มงานใหม่
                                </p>
                            </li>
                        </ul>
                    </section>

                    {/* Buttons */}
                    {showButtons && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800 animate-slide-in-up">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 text-center">
                                คุณเข้าใจวิธีการใช้งานแล้วหรือยัง?
                            </h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleNotUnderstand}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all hover:scale-105"
                                >
                                    <XCircle className="w-5 h-5" />
                                    ฉันยังไม่เข้าใจ
                                    <ArrowUp className="w-4 h-4 ml-2" />
                                </button>
                                <button
                                    onClick={handleUnderstand}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg shadow-blue-600/30"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    ฉันเข้าใจแล้ว
                                </button>
                            </div>
                        </div>
                    )}


                </div>
            </div>
        </div>
    );
}
