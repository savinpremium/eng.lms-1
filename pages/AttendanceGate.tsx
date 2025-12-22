
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { smsService } from '../services/smsService';
import { ShieldCheck, AlertCircle, Scan, History, Camera, AlertTriangle, UserCheck, RotateCcw, Check, X, Bell, Loader2 } from 'lucide-react';
import { Student } from '../types';

const AttendanceGate: React.FC = () => {
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR' | 'GRACE' | 'PROCESSING'>('IDLE');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'warning' | 'info'} | null>(null);
  const [lastStudent, setLastStudent] = useState<Student | null>(null);
  const [lastEntryId, setLastEntryId] = useState<string | null>(null);
  const [recentRecords, setRecentRecords] = useState<Student[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const unsub = storageService.listenStudents((data) => {
      setStudents(data);
      setIsDataLoaded(true);
    });
    return () => unsub();
  }, []);

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported on this device.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error(e));
          tick();
        };
      }
    } catch (err: any) {
      setCameraError(`Camera Error: ${err.message}`);
    }
  };

  const tick = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        // Optimization: Use a smaller canvas for scanning to increase speed and sensitivity
        const scanWidth = 640;
        const scanHeight = (videoRef.current.videoHeight / videoRef.current.videoWidth) * scanWidth;
        
        canvas.width = scanWidth;
        canvas.height = scanHeight;
        
        ctx.drawImage(videoRef.current, 0, 0, scanWidth, scanHeight);
        const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
        
        if ((window as any).jsQR) {
          const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth", // Significant boost for inverted QR codes and low light
          });

          if (code && code.data && code.data.toUpperCase().startsWith('STU-')) {
            handleScan(code.data.toUpperCase());
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

  const showNotification = (message: string, type: 'success' | 'warning' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleScan = async (studentId: string) => {
    // Crucial: Only handle scan if idle and data is fully loaded
    if (status !== 'IDLE' || !isDataLoaded || students.length === 0) return;
    
    setStatus('PROCESSING');

    const student = students.find(s => s.id.toUpperCase() === studentId.toUpperCase());
    
    if (student) {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().slice(0, 7); 
      
      const isPaid = student.lastPaymentMonth >= currentMonth;

      const attendance = await storageService.getAttendance();
      const alreadyMarked = attendance.some(a => a.studentId === student.id && a.date === today);

      if (alreadyMarked) {
        setStatus('SUCCESS');
        showNotification(`${student.name} already checked in.`, 'info');
        audioService.speak(`${student.name} already checked in.`);
        setTimeout(() => setStatus('IDLE'), 2000);
        return;
      }

      const entryId = await storageService.addAttendance({
        id: '',
        studentId: student.id,
        date: today,
        timestamp: Date.now()
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const msg = `Excellence English: ${student.name} has arrived at the institute at ${timeStr}. Attendance marked. ස්තුතියි.`;
      smsService.sendSMS(student, msg, 'Attendance');

      setLastStudent(student);
      setLastEntryId(entryId);
      setRecentRecords(prev => [student, ...prev].slice(0, 5));

      if (isPaid) {
        setStatus('SUCCESS');
        audioService.playSuccess();
        audioService.speak(`Paid. Welcome ${student.name}.`);
        showNotification(`Attendance Recorded: ${student.name}`, 'success');
        setTimeout(() => setStatus('IDLE'), 2000);
      } else {
        setStatus('GRACE');
        audioService.playWarning();
        audioService.speak(`Grace period active for ${student.name}. Please update fees.`);
        showNotification(`Recorded (GRACE): ${student.name} - Fees Overdue`, 'warning');
        setTimeout(() => setStatus('IDLE'), 3500);
      }
    } else {
      setStatus('ERROR');
      audioService.playError();
      showNotification("Identity not found in database.", "warning");
      setTimeout(() => setStatus('IDLE'), 1500);
    }
  };

  const undoLastEntry = async () => {
    if (!lastEntryId) return;
    if (!confirm("Delete last attendance entry?")) return;
    await storageService.deleteAttendance(lastEntryId);
    setRecentRecords(prev => prev.slice(1));
    setLastStudent(null);
    setLastEntryId(null);
    showNotification("Entry removed successfully.", "info");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 relative">
      {notification && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-5 rounded-[2rem] border shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 duration-500 ${
          notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' :
          notification.type === 'warning' ? 'bg-amber-600 border-amber-500 text-white' :
          'bg-blue-600 border-blue-500 text-white'
        }`}>
          <Bell className="animate-bounce" size={24} />
          <p className="font-black uppercase tracking-tight text-base">{notification.message}</p>
        </div>
      )}

      <header className="text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none mb-3 text-white">Gate Terminal</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[10px]">Secure Institutional Pass Verification</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className={`relative rounded-[5rem] overflow-hidden border-8 transition-all duration-700 shadow-3xl bg-slate-900 min-h-[550px] flex items-center justify-center animate-in zoom-in-95 ${
          status === 'SUCCESS' ? 'border-emerald-500' : 
          status === 'GRACE' ? 'border-amber-500' : 
          status === 'ERROR' ? 'border-rose-500' : 
          'border-slate-800'
        }`}>
          {cameraError ? (
            <div className="p-16 text-center flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center shadow-inner">
                <AlertTriangle size={48} />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-tight text-lg leading-relaxed">{cameraError}</p>
              <button 
                onClick={startScanner}
                className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 transition-all shadow-2xl shadow-blue-600/20"
              >
                <Camera size={24} />
                AUTHORIZE CAMERA
              </button>
            </div>
          ) : (
            <>
              {/* Corrected: Environment camera is NOT mirrored (scale-x-1) */}
              <video ref={videoRef} className="w-full h-[550px] object-cover scale-x-1" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className={`w-80 h-80 border-4 rounded-[4.5rem] flex items-center justify-center transition-all duration-500 ${
                  status === 'SUCCESS' ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_80px_rgba(16,185,129,0.2)]' : 
                  status === 'GRACE' ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_80px_rgba(245,158,11,0.2)]' : 
                  status === 'ERROR' ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_80px_rgba(244,63,94,0.2)]' : 
                  'border-white/20'
                }`}>
                  {status === 'SUCCESS' && <Check className="text-emerald-500" size={120} strokeWidth={4} />}
                  {status === 'GRACE' && <AlertCircle className="text-amber-500" size={120} strokeWidth={4} />}
                  {status === 'ERROR' && <X className="text-rose-500" size={120} strokeWidth={4} />}
                  {status === 'PROCESSING' && <Loader2 className="text-blue-500 animate-spin" size={80} strokeWidth={4} />}
                  {status === 'IDLE' && <Scan className="text-white/20 animate-pulse" size={80} />}
                </div>
              </div>

              {!isDataLoaded && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-12">
                   <Loader2 className="animate-spin text-blue-500 mb-6" size={48} />
                   <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Syncing Institutional Database...</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900/50 p-12 rounded-[4rem] border border-slate-800 shadow-2xl animate-in fade-in slide-in-from-right-8 duration-700">
            <h3 className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-8 flex items-center gap-3">
              <UserCheck size={18} className="text-blue-500" />
              Live Identity Analytics
            </h3>
            {lastStudent ? (
              <div className="animate-in zoom-in duration-500">
                <p className="text-5xl font-black tracking-tighter mb-3 text-white uppercase italic leading-none">{lastStudent.name}</p>
                <div className="flex items-center gap-3 text-emerald-500 font-black text-xs uppercase tracking-[0.3em] mb-8">
                   <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${status === 'GRACE' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                   Identity Marked & SMS Sent
                </div>
                <button 
                  onClick={undoLastEntry}
                  className="flex items-center gap-2 bg-slate-800 text-rose-500 px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-750 transition-all border border-slate-700"
                >
                  <RotateCcw size={14} />
                  Undo Last Entry
                </button>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-3xl font-black text-slate-800 uppercase italic leading-tight">Terminal Operational.<br />Align Card for Access.</p>
              </div>
            )}
          </div>

          <div className="bg-slate-950 p-12 rounded-[4rem] border border-slate-900 shadow-3xl animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
            <h3 className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-8 flex items-center gap-3">
              <History size={18} className="text-blue-500" />
              Recent Authentications
            </h3>
            <div className="space-y-4">
              {recentRecords.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-900/30 p-6 rounded-[2rem] border border-slate-800/30 hover:bg-slate-900/50 transition-all group">
                  <div className="text-left">
                    <span className="font-black text-slate-200 uppercase text-lg leading-none block">{r.name}</span>
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1 block">{r.id}</span>
                  </div>
                  <span className="text-[9px] bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white px-4 py-2 rounded-full font-black tracking-widest uppercase transition-all">{r.grade}</span>
                </div>
              ))}
              {recentRecords.length === 0 && (
                <div className="py-8 text-center opacity-20">
                   <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Historical Log Empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceGate;
