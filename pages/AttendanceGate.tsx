
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { ShieldCheck, AlertCircle, Scan, History } from 'lucide-react';

const AttendanceGate: React.FC = () => {
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [lastStudent, setLastStudent] = useState<string | null>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    
    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Camera access denied", err);
      }
    };

    const tick = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data && code.data.startsWith('Stu-')) {
            handleScan(code.data);
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startScanner();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleScan = (studentId: string) => {
    const students = storageService.getStudents();
    const student = students.find(s => s.id === studentId);
    
    if (student) {
      // Check for double scan today
      const today = new Date().toISOString().split('T')[0];
      const attendance = storageService.getAttendance();
      const alreadyMarked = attendance.some(a => a.studentId === studentId && a.date === today);

      if (alreadyMarked) {
        // Just ignore or show minor notification if already scanned
        return;
      }

      // Check payment status (e.g., must have paid current month)
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      if (student.lastPaymentMonth < currentMonth) {
        setStatus('ERROR');
        audioService.playError();
        audioService.speak("Please pay your monthly fee");
        setTimeout(() => setStatus('IDLE'), 3000);
      } else {
        storageService.addAttendance({
          id: Date.now().toString(),
          studentId,
          date: today,
          timestamp: Date.now()
        });
        setLastStudent(student.name);
        setRecentRecords(prev => [student, ...prev].slice(0, 5));
        setStatus('SUCCESS');
        audioService.playSuccess();
        audioService.speak(`Welcome ${student.name}`);
        setTimeout(() => setStatus('IDLE'), 2000);
      }
    } else {
      setStatus('ERROR');
      audioService.playError();
      setTimeout(() => setStatus('IDLE'), 1000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="text-center">
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Attendance Gate</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Biometric Entry Verification System</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Feed */}
        <div className={`relative rounded-[4rem] overflow-hidden border-4 transition-all duration-500 shadow-2xl ${
          status === 'SUCCESS' ? 'border-emerald-500 shadow-emerald-500/20' : 
          status === 'ERROR' ? 'border-rose-500 shadow-rose-500/20' : 
          'border-slate-800'
        }`}>
          <video ref={videoRef} className="w-full h-[400px] object-cover scale-x-[-1]" />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-64 h-64 border-2 rounded-[3rem] flex items-center justify-center ${
              status === 'SUCCESS' ? 'border-emerald-500/50' : 'border-white/20'
            }`}>
              <Scan className={`text-white/20 ${status === 'IDLE' ? 'animate-pulse' : ''}`} size={48} />
            </div>
          </div>

          <div className={`absolute inset-x-0 bottom-0 p-8 flex items-center justify-center text-2xl font-black uppercase tracking-tighter backdrop-blur-3xl transition-all duration-500 ${
            status === 'SUCCESS' ? 'bg-emerald-600 text-white translate-y-0' :
            status === 'ERROR' ? 'bg-rose-600 text-white translate-y-0' :
            'translate-y-full'
          }`}>
            {status === 'SUCCESS' ? <ShieldCheck className="mr-3" /> : <AlertCircle className="mr-3" />}
            {status === 'SUCCESS' ? 'ACCESS GRANTED' : 'PAYMENT OVERDUE'}
          </div>
        </div>

        {/* Info & History */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-500 mb-6 flex items-center gap-2">
              <Scan size={14} />
              Current Status
            </h3>
            {lastStudent ? (
              <div>
                <p className="text-4xl font-black tracking-tighter mb-1">{lastStudent}</p>
                <p className="text-emerald-500 font-bold text-sm">Verified Successfully</p>
              </div>
            ) : (
              <p className="text-2xl font-black text-slate-700 uppercase italic">Waiting for scan...</p>
            )}
          </div>

          <div className="bg-slate-950 p-8 rounded-[3rem] border border-slate-900">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-500 mb-6 flex items-center gap-2">
              <History size={14} />
              Recent Entry
            </h3>
            <div className="space-y-4">
              {recentRecords.length > 0 ? recentRecords.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl">
                  <span className="font-bold">{r.name}</span>
                  <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-black">{r.grade}</span>
                </div>
              )) : (
                <p className="text-slate-600 text-sm italic">No recent scans</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceGate;
