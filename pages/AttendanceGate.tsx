
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { UserCheck, History, RotateCcw, Loader2, ScanQrCode, AlertTriangle, Check, X, Zap, Camera, ShieldAlert, Image as ImageIcon, Info, Smartphone } from 'lucide-react';
import { Student } from '../types';

const AttendanceGate: React.FC = () => {
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR' | 'GRACE' | 'PROCESSING'>('IDLE');
  const [lastStudent, setLastStudent] = useState<Student | null>(null);
  const [lastEntryId, setLastEntryId] = useState<string | null>(null);
  const [recentRecords, setRecentRecords] = useState<Student[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [isDecodingFile, setIsDecodingFile] = useState(false);

  const scannerRef = useRef<any>(null);
  const statusRef = useRef(status);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    // Check for HTTPS/Localhost requirement
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const secure = window.isSecureContext || window.location.hostname === 'localhost';
    setIsSecure(!!secure && hasMedia);
    
    if (!secure || !hasMedia) {
      setCameraError("MOBILE ALERT: Live camera requires an HTTPS connection. Please use the 'Capture Photo' option below.");
    }

    const unsub = storageService.listenStudents((data) => {
      setStudents(data);
      setIsDataLoaded(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let active = true;
    if (isScannerActive) {
      const initScanner = async () => {
        // Longer wait for mobile DOM layout
        await new Promise(r => setTimeout(r, 300));
        if (!active) return;

        try {
          const Html5Qrcode = (window as any).Html5Qrcode;
          if (!Html5Qrcode) {
            setCameraError("System library missing. Please refresh.");
            setIsScannerActive(false);
            return;
          }

          const element = document.getElementById("qr-reader-attendance");
          if (!element) {
            setCameraError("Hardware mount failed. Retrying...");
            setIsScannerActive(false);
            return;
          }

          scannerRef.current = new Html5Qrcode("qr-reader-attendance");
          
          // Relaxed constraints for mobile compatibility
          const config = { 
            fps: 20, 
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.floor(minEdge * 0.7);
              return { width: size, height: size };
            },
            aspectRatio: undefined // Let the hardware decide
          };

          await scannerRef.current.start(
            { facingMode: "environment" },
            config,
            (decodedText: string) => {
              if (statusRef.current === 'IDLE') {
                handleScan(decodedText);
              }
            }
          );
        } catch (err: any) {
          console.error("Scanner Initialization Error:", err);
          if (active) {
            setIsScannerActive(false);
            const msg = err.name === 'NotAllowedError' 
              ? "Permission Denied: Please enable camera in settings." 
              : "Hardware Error: Camera is busy or unavailable.";
            setCameraError(msg);
          }
        }
      };

      initScanner();
    }

    return () => {
      active = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch (e) {}
      }
    };
  }, [isScannerActive]);

  const startScanner = () => {
    if (!isDataLoaded) return;
    setCameraError(null);
    if (!isSecure && window.location.hostname !== 'localhost') {
      setCameraError("Security Block: Live video is restricted to HTTPS. Use 'Capture Photo' instead.");
      return;
    }
    setIsScannerActive(true);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
    }
    setIsScannerActive(false);
    scannerRef.current = null;
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isDataLoaded) return;

    setIsDecodingFile(true);
    const mountId = "render-buffer"; // Use stable buffer
    try {
      const Html5Qrcode = (window as any).Html5Qrcode;
      const html5QrCode = new Html5Qrcode(mountId, false);
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScan(decodedText);
    } catch (err) {
      console.error("Manual Capture Error:", err);
      audioService.playError();
      alert("Scan Failed: Could not detect a QR code. Please ensure the code is flat and well-lit.");
    } finally {
      setIsDecodingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleScan = async (studentId: string) => {
    if (statusRef.current !== 'IDLE') return;
    
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
          audioService.speak(`${student.name} is already present.`);
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
          audioService.speak(`Payment required for ${student.name}`);
          setTimeout(() => setStatus('IDLE'), 3500);
        }
      } catch (e) {
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
      <header className="text-center animate-in fade-in duration-700">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none mb-3 text-white">Optical Gate</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[10px] flex items-center justify-center gap-2">
          <Zap size={12} className="text-blue-500" />
          Secure Access Point
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className={`relative rounded-[4rem] md:rounded-[5rem] overflow-hidden border-8 transition-all duration-300 shadow-3xl bg-slate-900 min-h-[500px] md:min-h-[550px] flex flex-col items-center justify-center p-0 text-center ${
          status === 'SUCCESS' ? 'border-emerald-500 shadow-emerald-500/20' : 
          status === 'GRACE' ? 'border-amber-500 shadow-amber-500/20' : 
          status === 'ERROR' ? 'border-rose-500 shadow-rose-500/20' : 
          'border-slate-800'
        }`}>
          {!isScannerActive ? (
            <div className="p-8 md:p-10 animate-in zoom-in duration-500 space-y-8 w-full">
              {!isSecure ? (
                <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-[2.5rem] flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
                  <ShieldAlert size={48} className="text-rose-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 leading-relaxed">
                    Live video requires HTTPS (SSL). <br />Use manual capture below.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950 p-6 rounded-[2.5rem] border border-slate-800 shadow-inner flex items-center gap-4 text-left max-w-sm mx-auto">
                  <Smartphone size={32} className="text-blue-500 flex-shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed">
                    Position your student ID clearly in front of the lens.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                {isSecure && (
                  <button 
                    onClick={startScanner}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-4 border-b-4 border-blue-800"
                  >
                    <ScanQrCode size={20} />
                    Start Live Gate
                  </button>
                )}
                
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    ref={fileInputRef}
                    onChange={handleFileScan}
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isDecodingFile}
                    className={`w-full ${!isSecure ? 'bg-blue-600 border-blue-800 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'} px-8 py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-4 border-b-4 shadow-xl`}
                  >
                    {isDecodingFile ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                    {!isSecure ? 'Capture Photo' : 'Fallback Capture'}
                  </button>
                </div>
              </div>

              {cameraError && (
                <div className="bg-rose-500/10 border border-rose-500/50 p-4 rounded-2xl">
                   <p className="text-rose-500 font-black uppercase text-[8px] tracking-[0.2em]">{cameraError}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-[500px] md:h-[550px] bg-black">
              <div id="qr-reader-attendance" className="w-full h-full"></div>
              <button 
                onClick={stopScanner}
                className="absolute top-6 right-6 z-30 bg-slate-950/90 p-4 rounded-3xl text-white hover:text-rose-500 transition-all border border-slate-800 shadow-2xl"
              >
                <X size={24} />
              </button>
              
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

        <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
          <div className="bg-slate-900/50 p-10 md:p-12 rounded-[3.5rem] md:rounded-[4rem] border border-slate-800 shadow-2xl relative overflow-hidden">
            <h3 className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-8 flex items-center gap-3">
              <UserCheck size={18} className="text-blue-500" />
              Verified Identity
            </h3>
            {lastStudent ? (
              <div className="animate-in zoom-in duration-500">
                <p className="text-4xl md:text-5xl font-black tracking-tighter mb-3 text-white uppercase italic leading-none">{lastStudent.name}</p>
                <div className="flex items-center gap-3 text-emerald-500 font-black text-xs uppercase tracking-[0.3em] mb-8">
                   <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${status === 'GRACE' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                   {status === 'GRACE' ? 'FEE PENDING' : 'Active Pass'}
                </div>
                <button onClick={undoLastEntry} className="flex items-center gap-2 bg-slate-800 text-rose-500 px-6 py-3 rounded-full font-black uppercase text-[10px] border border-slate-700 hover:bg-rose-600 hover:text-white transition-all shadow-lg">
                  <RotateCcw size={14} />
                  Invalidate Log
                </button>
              </div>
            ) : (
              <div className="py-6 opacity-20 text-center">
                <ScanQrCode size={48} className="mx-auto mb-4" />
                <p className="text-2xl font-black text-slate-400 uppercase italic tracking-tighter">Awaiting Signal</p>
              </div>
            )}
          </div>

          <div className="bg-slate-950 p-10 md:p-12 rounded-[3.5rem] md:rounded-[4rem] border border-slate-900 shadow-3xl">
            <h3 className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-8 flex items-center gap-3">
              <History size={18} className="text-blue-500" />
              Recent Traffic
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
                  <p className="text-[9px] font-black uppercase tracking-[0.4em]">Ready for Verification</p>
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
