import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { ShieldCheck, AlertCircle, Scan, History, Camera, AlertTriangle } from 'lucide-react';

const AttendanceGate: React.FC = () => {
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [lastStudent, setLastStudent] = useState<string | null>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanTimeoutRef = useRef<any>(null);

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available in this browser/environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Error playing video:", e));
          tick();
        };
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' 
        ? "Camera access denied. Please allow camera permissions in your browser settings." 
        : `Could not start camera: ${err.message}`);
    }
  };

  const tick = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Ensure jsQR is available globally from index.html script
        if ((window as any).jsQR) {
          const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data && code.data.startsWith('STU-')) {
            handleScan(code.data);
          }
        }
      }
    }
    scanTimeoutRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    startScanner();
    return () => {
      cancelAnimationFrame(scanTimeoutRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleScan = (studentId: string) => {
    if (status !== 'IDLE') return;

    const students = storageService.getStudents();
    const student = students.find(s => s.id === studentId);
    
    if (student) {
      const today = new Date().toISOString().split('T')[0];
      const attendance = storageService.getAttendance();
      const alreadyMarked = attendance.some(a => a.studentId === studentId && a.date === today);

      if (alreadyMarked) {
        setStatus('SUCCESS');
        audioService.speak(`Already marked for ${student.name}`);
        setTimeout(() => setStatus('IDLE'), 2000);
        return;
      }

      const currentMonth = new Date().toISOString().slice(0, 7); 
      if (student.lastPaymentMonth < currentMonth) {
        setStatus('ERROR');
        audioService.playError();
        audioService.speak("Payment Overdue");
        setTimeout(() => setStatus('IDLE'), 4000);
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
        audioService.speak(`Authorized, welcome ${student.name}`);
        setTimeout(() => setStatus('IDLE'), 2000);
      }
    } else {
      setStatus('ERROR');
      audioService.playError();
      setTimeout(() => setStatus('IDLE'), 1500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="text-center">
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Smart QR Entry</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Excellence English Gate Management</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`relative rounded-[4rem] overflow-hidden border-4 transition-all duration-500 shadow-2xl bg-slate-900 min-h-[450px] flex items-center justify-center ${
          status === 'SUCCESS' ? 'border-emerald-500 shadow-emerald-500/30' : 
          status === 'ERROR' ? 'border-rose-500 shadow-rose-500/30' : 
          'border-slate-800'
        }`}>
          {cameraError ? (
            <div className="p-10 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <p className="text-slate-300 font-bold">{cameraError}</p>
              <button 
                onClick={startScanner}
                className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl shadow-blue-600/20"
              >
                <Camera size={20} />
                RETRY CAMERA
              </button>
            </div>
          ) : (
            <>
              <video ref={videoRef} className="w-full h-[450px] object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className={`w-72 h-72 border-2 rounded-[4rem] flex items-center justify-center transition-all duration-300 ${
                  status === 'SUCCESS' ? 'border-emerald-500 scale-110' : 
                  status === 'ERROR' ? 'border-rose-500 scale-90' : 
                  'border-white/20'
                }`}>
                  <Scan className={`text-white/20 ${status === 'IDLE' ? 'animate-pulse' : ''}`} size={64} />
                </div>
              </div>

              <div className={`absolute inset-x-0 bottom-0 p-8 flex items-center justify-center text-2xl font-black uppercase tracking-tighter backdrop-blur-3xl transition-all duration-500 ${
                status === 'SUCCESS' ? 'bg-emerald-600 text-white translate-y-0' :
                status === 'ERROR' ? 'bg-rose-600 text-white translate-y-0' :
                'translate-y-full'
              }`}>
                {status === 'SUCCESS' ? <ShieldCheck className="mr-3" /> : <AlertCircle className="mr-3" />}
                {status === 'SUCCESS' ? 'ACCESS GRANTED' : 'OVERDUE NOTICE'}
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800 shadow-xl">
            <h3 className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-500 mb-6 flex items-center gap-2">
              <Scan size={14} className="text-blue-500" />
              Live Stream Analytics
            </h3>
            {lastStudent ? (
              <div className="animate-in fade-in slide-in-from-left-4">
                <p className="text-4xl font-black tracking-tighter mb-2 text-white uppercase">{lastStudent}</p>
                <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                   Verified Successfully
                </div>
              </div>
            ) : (
              <p className="text-2xl font-black text-slate-700 uppercase italic leading-tight">System Armed.<br />Waiting for PVC Identity.</p>
            )}
          </div>

          <div className="bg-slate-950 p-10 rounded-[3rem] border border-slate-900 shadow-2xl">
            <h3 className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-500 mb-6 flex items-center gap-2">
              <History size={14} className="text-blue-500" />
              Recent Entries
            </h3>
            <div className="space-y-3">
              {recentRecords.length > 0 ? recentRecords.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-900/50 p-5 rounded-2xl border border-slate-800/50">
                  <span className="font-black text-slate-200 uppercase">{r.name}</span>
                  <span className="text-[9px] bg-blue-600 text-white px-3 py-1 rounded-full font-black tracking-widest uppercase">{r.grade}</span>
                </div>
              )) : (
                <p className="text-slate-600 text-xs italic">Log empty for current session</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceGate;