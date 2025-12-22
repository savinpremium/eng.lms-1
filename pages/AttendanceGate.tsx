
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { smsService } from '../services/smsService';
import { ShieldCheck, AlertCircle, Scan, History, Camera, AlertTriangle, UserCheck, RotateCcw, Check, X, Bell, Loader2, Zap, Keyboard } from 'lucide-react';
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
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualId, setManualId] = useState('');
  
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
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Video play error:", e));
          tick();
        };
      }
    } catch (err: any) {
      setCameraError(`Camera Error: ${err.name}. Please ensure permissions are granted.`);
    }
  };

  const tick = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
      
      if (ctx) {
        const v = videoRef.current;
        const w = 480; 
        const h = (v.videoHeight / v.videoWidth) * w;
        canvas.width = w;
        canvas.height = h;
        
        ctx.drawImage(v, 0, 0, w, h);
        
        // VISION ENGINE: Linear Contrast Stretch & Sharpening
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2];
          // Luma-based grayscale
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          // Contrast Stretching: Darken the darks, brighten the brights
          if (gray < 100) gray = gray * 0.5;
          else if (gray > 160) gray = Math.min(255, gray * 1.2);
          
          data[i] = data[i+1] = data[i+2] = gray;
        }
        
        // Access jsQR safely
        const jsQRFunc = (window as any).jsQR;
        if (jsQRFunc) {
          const result = jsQRFunc(data, w, h, {
            inversionAttempts: "attemptBoth",
          });

          if (result && result.data) {
            const raw = result.data.trim().toUpperCase();
            const match = raw.match(/(STU-\d{4}-\d{4})/);
            const foundId = match ? match[1] : (raw.startsWith('STU-') ? raw : null);

            if (foundId) {
              const now = Date.now();
              if (foundId !== lastScannedIdRef.current || now - lastScanTimeRef.current > 5000) {
                handleScan(foundId);
                lastScannedIdRef.current = foundId;
                lastScanTimeRef.current = now;
              }
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
      if (scanTimeoutRef.current) cancelAnimationFrame(scanTimeoutRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleScan = async (studentId: string) => {
    if (status !== 'IDLE' || !isDataLoaded) return;
    
    setStatus('PROCESSING');
    audioService.playTone(600, 'sine', 0.1); 

    const student = students.find(s => s.id.toUpperCase() === studentId.toUpperCase());
    
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
      const msg = `Excellence English: ${student.name} arrived at ${timeStr}. Attendance marked. ස්තුතියි.`;
      smsService.sendSMS(student, msg, 'Attendance');

      setLastStudent(student);
      setLastEntryId(entryId);
      setRecentRecords(prev => [student, ...prev].slice(0, 5));

      if (isPaid) {
        setStatus('SUCCESS');
        audioService.playSuccess();
        audioService.speak(`Welcome ${student.name}`);
        setTimeout(() => setStatus('IDLE'), 2000);
      } else {
        setStatus('GRACE');
        audioService.playWarning();
        audioService.speak(`Attention ${student.name}, monthly fee is due.`);
        setTimeout(() => setStatus('IDLE'), 3500);
      }
    } else {
      setStatus('ERROR');
      audioService.playError();
      setTimeout(() => setStatus('IDLE'), 2000);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId) {
      handleScan(manualId.toUpperCase());
      setManualId('');
      setShowManualEntry(false);
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
      <header className="text-center">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none mb-3 text-white">Institutional Gate</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[10px] flex items-center justify-center gap-2">
          <Zap size={12} className="text-blue-500 fill-blue-500" />
          High-Contrast Vision Protocol Active
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className={`relative rounded-[5rem] overflow-hidden border-8 transition-all duration-300 shadow-3xl bg-slate-950 min-h-[550px] flex items-center justify-center ${
          status === 'SUCCESS' ? 'border-emerald-500 shadow-emerald-500/20' : 
          status === 'GRACE' ? 'border-amber-500 shadow-amber-500/20' : 
          status === 'ERROR' ? 'border-rose-500 shadow-rose-500/20' : 
          'border-slate-800'
        }`}>
          {cameraError ? (
            <div className="p-16 text-center flex flex-col items-center gap-6">
              <AlertTriangle size={48} className="text-rose-500" />
              <p className="text-slate-400 font-bold uppercase tracking-tight text-lg leading-tight">{cameraError}</p>
              <button onClick={() => window.location.reload()} className="bg-blue-600 px-10 py-5 rounded-[2rem] font-black uppercase text-xs">HARD REFRESH SYSTEM</button>
            </div>
          ) : (
            <>
              <video ref={videoRef} className="w-full h-[550px] object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className={`w-80 h-80 border-2 rounded-[3.5rem] flex items-center justify-center transition-all duration-300 ${
                  status === 'SUCCESS' ? 'border-emerald-500 bg-emerald-500/10' : 
                  status === 'GRACE' ? 'border-amber-500 bg-amber-500/10' : 
                  status === 'ERROR' ? 'border-rose-500 bg-rose-500/10' : 
                  'border-white/10 shadow-[inset_0_0_50px_rgba(255,255,255,0.05)]'
                }`}>
                  {status === 'IDLE' && (
                    <div className="w-full h-full relative">
                       <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-600 rounded-tl-3xl" />
                       <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-600 rounded-tr-3xl" />
                       <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-600 rounded-bl-3xl" />
                       <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-600 rounded-br-3xl" />
                       <div className="w-full h-1 bg-blue-500/20 absolute top-1/2 -translate-y-1/2 animate-bounce" />
                    </div>
                  )}
                  {status === 'PROCESSING' && <Loader2 className="text-blue-500 animate-spin" size={64} />}
                  {status === 'SUCCESS' && <Check className="text-emerald-500" size={100} strokeWidth={4} />}
                </div>
                <div className="mt-8 bg-slate-950/90 px-8 py-3 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Center pass to authenticate</p>
                </div>
              </div>

              {!isDataLoaded && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-12 z-50">
                   <Loader2 className="animate-spin text-blue-500 mb-6" size={48} />
                   <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Syncing Institutional Pass Keys...</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900/50 p-12 rounded-[4rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><UserCheck size={100} /></div>
            <h3 className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-8 flex items-center gap-3">
              <UserCheck size={18} className="text-blue-500" />
              Live Identity
            </h3>
            {lastStudent ? (
              <div className="animate-in zoom-in duration-500">
                <p className="text-5xl font-black tracking-tighter mb-3 text-white uppercase italic leading-none">{lastStudent.name}</p>
                <div className="flex items-center gap-3 text-emerald-500 font-black text-xs uppercase tracking-[0.3em] mb-8">
                   <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${status === 'GRACE' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                   Identity Marked
                </div>
                <div className="flex gap-3">
                  <button onClick={undoLastEntry} className="flex items-center gap-2 bg-slate-800 text-rose-500 px-6 py-3 rounded-full font-black uppercase text-[10px] border border-slate-700 hover:bg-rose-600 hover:text-white transition-all">
                    <RotateCcw size={14} />
                    Undo Log
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 opacity-20">
                <p className="text-3xl font-black text-slate-400 uppercase italic leading-tight">Ready for <br /> Recognition</p>
              </div>
            )}
            
            <div className="mt-12 pt-8 border-t border-slate-800/50">
               <button 
                 onClick={() => setShowManualEntry(true)}
                 className="w-full bg-slate-950 hover:bg-slate-800 text-slate-500 hover:text-white border border-slate-800 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all"
               >
                 <Keyboard size={16} />
                 Manual Identity Entry
               </button>
            </div>
          </div>

          <div className="bg-slate-950 p-12 rounded-[4rem] border border-slate-900 shadow-3xl">
            <h3 className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-8 flex items-center gap-3">
              <History size={18} className="text-blue-500" />
              Recent Authentications
            </h3>
            <div className="space-y-4">
              {recentRecords.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-900/30 p-6 rounded-[2rem] border border-slate-800/30 animate-in slide-in-from-right-4 duration-300">
                  <div className="text-left">
                    <span className="font-black text-slate-200 uppercase text-lg leading-none block">{r.name}</span>
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1 block">{r.id}</span>
                  </div>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-4 py-2 rounded-full font-black uppercase tracking-widest">{r.grade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-sm p-10 rounded-[4rem] border border-slate-800 shadow-3xl space-y-8 animate-in zoom-in duration-300">
            <div className="text-center">
              <h4 className="text-3xl font-black tracking-tighter uppercase italic text-white">Manual Pass</h4>
              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Emergency Identity Override</p>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <input 
                autoFocus
                placeholder="STU-2025-XXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-6 text-2xl font-black tracking-widest focus:border-blue-600 focus:outline-none text-center text-white uppercase"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowManualEntry(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-700">Cancel</button>
                <button className="flex-1 py-4 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-blue-600/20">Authenticate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceGate;
