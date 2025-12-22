
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { UserCheck, History, RotateCcw, Loader2, ScanQrCode, AlertTriangle, Check, X, Zap } from 'lucide-react';
import { Student } from '../types';

const AttendanceGate: React.FC = () => {
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR' | 'GRACE' | 'PROCESSING'>('IDLE');
  const [lastStudent, setLastStudent] = useState<Student | null>(null);
  const [lastEntryId, setLastEntryId] = useState<string | null>(null);
  const [recentRecords, setRecentRecords] = useState<Student[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const statusRef = useRef(status);

  // Keep ref in sync for the tick loop
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const unsub = storageService.listenStudents((data) => {
      setStudents(data);
      setIsDataLoaded(true);
    });
    return () => unsub();
  }, []);

  const tick = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Access jsQR from global scope
          const jsQR = (window as any).jsQR;
          
          if (typeof jsQR === 'function') {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth",
            });

            if (code && code.data && statusRef.current === 'IDLE') {
              handleScan(code.data);
            }
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
        await videoRef.current.play();
        setIsScanning(true);
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Camera access denied or unavailable. Please ensure permissions are granted.");
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleScan = async (studentId: string) => {
    if (statusRef.current !== 'IDLE' || !isDataLoaded) return;
    
    const cleanId = studentId.trim().toUpperCase();
    const student = students.find(s => s.id.toUpperCase() === cleanId);
    
    if (student) {
      setStatus('PROCESSING');
      audioService.playTone(600, 'sine', 0.1); 

      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().slice(0, 7); 
      const isPaid = student.lastPaymentMonth >= currentMonth;

      try {
        const attendance = await storageService.getAttendance();
        const alreadyMarked = attendance.some(a => a.studentId === student.id && a.date === today);

        if (alreadyMarked) {
          setStatus('SUCCESS');
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

        setLastStudent(student);
        setLastEntryId(entryId);
        setRecentRecords(prev => [student, ...prev].slice(0, 5));

        if (isPaid) {
          setStatus('SUCCESS');
          audioService.playSuccess();
          audioService.speak(`Welcome, ${student.name}`);
          setTimeout(() => setStatus('IDLE'), 2000);
        } else {
          setStatus('GRACE');
          audioService.playWarning();
          audioService.speak(`Payment pending for ${student.name}`);
          setTimeout(() => setStatus('IDLE'), 3500);
        }
      } catch (e) {
        console.error("Attendance log failed", e);
        setStatus('ERROR');
        setTimeout(() => setStatus('IDLE'), 2000);
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
      <header className="text-center">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none mb-3 text-white">QR Gate</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[10px] flex items-center justify-center gap-2">
          <Zap size={12} className="text-blue-500" />
          Real-time Identity Verification
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className={`relative rounded-[5rem] overflow-hidden border-8 transition-all duration-300 shadow-3xl bg-slate-900 min-h-[550px] flex flex-col items-center justify-center p-0 text-center ${
          status === 'SUCCESS' ? 'border-emerald-500 shadow-emerald-500/20' : 
          status === 'GRACE' ? 'border-amber-500 shadow-amber-500/20' : 
          status === 'ERROR' ? 'border-rose-500 shadow-rose-500/20' : 
          'border-slate-800'
        }`}>
          {cameraError ? (
            <div className="p-12">
              <AlertTriangle size={48} className="text-rose-500 mx-auto mb-6" />
              <p className="text-white font-black uppercase text-sm tracking-widest mb-4">{cameraError}</p>
              <button 
                onClick={startScanner}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest transition-all"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <div className="relative w-full h-[550px] bg-black">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                playsInline 
                muted 
                autoPlay
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Vision Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-72 h-72 border-2 rounded-[3rem] transition-all duration-500 ${status === 'IDLE' ? 'border-blue-500/50 scale-100' : 'border-transparent scale-110 opacity-0'}`}>
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl"></div>
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl"></div>
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl"></div>
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-2xl"></div>
                   <div className="w-full h-0.5 bg-blue-500/20 absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
                </div>
              </div>

              {!isScanning && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-blue-500" size={48} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Initializing Optical Input...</p>
                </div>
              )}

              {/* Status Overlays */}
              {status !== 'IDLE' && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-300 z-20">
                  {status === 'PROCESSING' && <Loader2 className="animate-spin text-blue-500" size={80} />}
                  {status === 'SUCCESS' && <Check className="text-emerald-500" size={100} strokeWidth={4} />}
                  {status === 'ERROR' && <X className="text-rose-500" size={100} strokeWidth={4} />}
                  {status === 'GRACE' && <AlertTriangle className="text-amber-500" size={100} strokeWidth={4} />}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900/50 p-12 rounded-[4rem] border border-slate-800 shadow-2xl relative overflow-hidden">
            <h3 className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-8 flex items-center gap-3">
              <UserCheck size={18} className="text-blue-500" />
              Detected Student
            </h3>
            {lastStudent ? (
              <div className="animate-in zoom-in duration-500">
                <p className="text-5xl font-black tracking-tighter mb-3 text-white uppercase italic leading-none">{lastStudent.name}</p>
                <div className="flex items-center gap-3 text-emerald-500 font-black text-xs uppercase tracking-[0.3em] mb-8">
                   <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${status === 'GRACE' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                   {status === 'GRACE' ? 'UNPAID - GRACE PERIOD' : 'Identity Verified'}
                </div>
                <button onClick={undoLastEntry} className="flex items-center gap-2 bg-slate-800 text-rose-500 px-6 py-3 rounded-full font-black uppercase text-[10px] border border-slate-700 hover:bg-rose-600 hover:text-white transition-all">
                  <RotateCcw size={14} />
                  Reverse Log
                </button>
              </div>
            ) : (
              <div className="py-4 opacity-20">
                <p className="text-3xl font-black text-slate-400 uppercase italic leading-tight text-center">Awaiting <br /> QR Scan</p>
              </div>
            )}
          </div>

          <div className="bg-slate-950 p-12 rounded-[4rem] border border-slate-900 shadow-3xl">
            <h3 className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-8 flex items-center gap-3">
              <History size={18} className="text-blue-500" />
              Session History
            </h3>
            <div className="space-y-4">
              {recentRecords.map((r, i) => (
                <div key={`${r.id}-${i}`} className="flex justify-between items-center bg-slate-900/30 p-6 rounded-[2rem] border border-slate-800/30 animate-in slide-in-from-right-4 duration-300">
                  <div className="text-left">
                    <span className="font-black text-slate-200 uppercase text-lg leading-none block">{r.name}</span>
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1 block">{r.id}</span>
                  </div>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-4 py-2 rounded-full font-black uppercase tracking-widest">{r.grade}</span>
                </div>
              ))}
              {recentRecords.length === 0 && (
                <div className="py-10 text-center opacity-10">
                  <ScanQrCode size={40} className="mx-auto mb-4" />
                  <p className="text-[9px] font-black uppercase tracking-[0.4em]">Ready for entry capture</p>
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
