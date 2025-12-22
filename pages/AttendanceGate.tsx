
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
  const lastScannedIdRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

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
      const constraints = { 
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30 }
        } 
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // required for iOS
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Play failed", e));
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
      const ctx = canvas.getContext('2d', { alpha: false });
      
      if (ctx) {
        // High Intensity Scanning: Sub-sample frame for speed
        const video = videoRef.current;
        const scanWidth = 640;
        const scanHeight = (video.videoHeight / video.videoWidth) * scanWidth;
        
        canvas.width = scanWidth;
        canvas.height = scanHeight;
        
        // Draw frame
        ctx.drawImage(video, 0, 0, scanWidth, scanHeight);
        
        // PRE-PROCESSING: Convert to grayscale and boost contrast for jsQR
        const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          // Simple Threshold/Contrast Boost
          const thresholded = avg > 128 ? 255 : 0;
          data[i] = thresholded;
          data[i+1] = thresholded;
          data[i+2] = thresholded;
        }
        
        if ((window as any).jsQR) {
          const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });

          if (code && code.data) {
            const rawId = code.data.trim().toUpperCase();
            const now = Date.now();
            
            // Prevent duplicate triggers for the same ID within 5 seconds unless reset
            if (rawId.startsWith('STU-') && (rawId !== lastScannedIdRef.current || now - lastScanTimeRef.current > 5000)) {
              handleScan(rawId);
              lastScannedIdRef.current = rawId;
              lastScanTimeRef.current = now;
            }
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

  const handleScan = async (studentId: string) => {
    if (status !== 'IDLE' || !isDataLoaded) return;
    
    setStatus('PROCESSING');
    
    // Exact match sanitization
    const cleanId = studentId.replace(/[^A-Z0-9-]/g, '');
    const student = students.find(s => s.id.toUpperCase() === cleanId);
    
    if (student) {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().slice(0, 7); 
      const isPaid = student.lastPaymentMonth >= currentMonth;

      const attendance = await storageService.getAttendance();
      const alreadyMarked = attendance.some(a => a.studentId === student.id && a.date === today);

      if (alreadyMarked) {
        setStatus('SUCCESS');
        audioService.speak(`${student.name} is already logged.`);
        setTimeout(() => setStatus('IDLE'), 1500);
        return;
      }

      const entryId = await storageService.addAttendance({
        id: '',
        studentId: student.id,
        date: today,
        timestamp: Date.now()
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const msg = `Excellence English: ${student.name} has arrived at ${timeStr}. Attendance marked. ස්තුතියි.`;
      smsService.sendSMS(student, msg, 'Attendance');

      setLastStudent(student);
      setLastEntryId(entryId);
      setRecentRecords(prev => [student, ...prev].slice(0, 5));

      if (isPaid) {
        setStatus('SUCCESS');
        audioService.playSuccess();
        audioService.speak(`Access Granted. Welcome ${student.name}.`);
        setTimeout(() => setStatus('IDLE'), 2000);
      } else {
        setStatus('GRACE');
        audioService.playWarning();
        audioService.speak(`Grace period for ${student.name}. Monthly fee due.`);
        setTimeout(() => setStatus('IDLE'), 3500);
      }
    } else {
      setStatus('ERROR');
      audioService.playError();
      setTimeout(() => setStatus('IDLE'), 2000);
    }
  };

  const undoLastEntry = async () => {
    if (!lastEntryId) return;
    if (!confirm("Reverse last entry?")) return;
    await storageService.deleteAttendance(lastEntryId);
    setRecentRecords(prev => prev.slice(1));
    setLastStudent(null);
    setLastEntryId(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 relative">
      <header className="text-center animate-in fade-in duration-500">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none mb-3 text-white">Security Gate</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[10px]">Ultra-Sensitive QR Pass Verification</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className={`relative rounded-[5rem] overflow-hidden border-8 transition-all duration-700 shadow-3xl bg-slate-950 min-h-[550px] flex items-center justify-center ${
          status === 'SUCCESS' ? 'border-emerald-500' : 
          status === 'GRACE' ? 'border-amber-500' : 
          status === 'ERROR' ? 'border-rose-500' : 
          'border-slate-800'
        }`}>
          {cameraError ? (
            <div className="p-16 text-center flex flex-col items-center gap-6">
              <AlertTriangle size={48} className="text-rose-500" />
              <p className="text-slate-400 font-bold uppercase tracking-tight text-lg">{cameraError}</p>
              <button onClick={startScanner} className="bg-blue-600 px-10 py-5 rounded-[2rem] font-black">RETRY HARDWARE</button>
            </div>
          ) : (
            <>
              {/* ENVIRONMENT CAMERA FEED - ABSOLUTELY NO MIRRORING (scale-x-1) */}
              <video ref={videoRef} className="w-full h-[550px] object-cover scale-x-1" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* FOCUS GUIDER OVERLAY */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className={`w-80 h-80 border-4 border-dashed rounded-[4.5rem] flex items-center justify-center transition-all duration-500 ${
                  status === 'SUCCESS' ? 'border-emerald-500 bg-emerald-500/10 scale-110' : 
                  status === 'GRACE' ? 'border-amber-500 bg-amber-500/10 scale-110' : 
                  status === 'ERROR' ? 'border-rose-500 bg-rose-500/10' : 
                  'border-white/30'
                }`}>
                  <div className={`w-12 h-12 border-2 border-white/20 rounded-full ${status === 'IDLE' ? 'animate-ping' : 'opacity-0'}`} />
                  {status === 'PROCESSING' && <Loader2 className="text-blue-500 animate-spin" size={80} />}
                  {status === 'SUCCESS' && <Check className="text-emerald-500" size={120} />}
                </div>
                <div className="mt-8 bg-slate-950/80 px-6 py-2 rounded-full border border-white/10">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Center ID inside square</p>
                </div>
              </div>

              {!isDataLoaded && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-12 z-50">
                   <Loader2 className="animate-spin text-blue-500 mb-6" size={48} />
                   <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Loading Student Registry...</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900/50 p-12 rounded-[4rem] border border-slate-800 shadow-2xl">
            <h3 className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-8 flex items-center gap-3">
              <UserCheck size={18} className="text-blue-500" />
              Live Identity
            </h3>
            {lastStudent ? (
              <div className="animate-in zoom-in duration-500">
                <p className="text-5xl font-black tracking-tighter mb-3 text-white uppercase italic leading-none">{lastStudent.name}</p>
                <div className="flex items-center gap-3 text-emerald-500 font-black text-xs uppercase tracking-[0.3em] mb-8">
                   <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${status === 'GRACE' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                   Identity Authenticated
                </div>
                <button onClick={undoLastEntry} className="flex items-center gap-2 bg-slate-800 text-rose-500 px-6 py-3 rounded-full font-black uppercase text-[10px] border border-slate-700">
                  <RotateCcw size={14} />
                  Reverse Entry
                </button>
              </div>
            ) : (
              <div className="py-4 opacity-30">
                <p className="text-3xl font-black text-slate-400 uppercase italic leading-tight">Ready for <br /> Authentication</p>
              </div>
            )}
          </div>

          <div className="bg-slate-950 p-12 rounded-[4rem] border border-slate-900 shadow-3xl">
            <h3 className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-8 flex items-center gap-3">
              <History size={18} className="text-blue-500" />
              Recent Logs
            </h3>
            <div className="space-y-4">
              {recentRecords.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-900/30 p-6 rounded-[2rem] border border-slate-800/30">
                  <div className="text-left">
                    <span className="font-black text-slate-200 uppercase text-lg leading-none block">{r.name}</span>
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1 block">{r.id}</span>
                  </div>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-4 py-2 rounded-full font-black uppercase">{r.grade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceGate;
