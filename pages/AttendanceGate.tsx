
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { UserCheck, History, RotateCcw, Loader2, ScanQrCode, AlertTriangle, Check, X, Zap, Camera, ShieldAlert, Smartphone } from 'lucide-react';
import { Student } from '../types';

interface AttendanceGateProps {
  institutionId: string;
}

const AttendanceGate: React.FC<AttendanceGateProps> = ({ institutionId }) => {
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
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const secure = window.isSecureContext || window.location.hostname === 'localhost';
    setIsSecure(!!secure && hasMedia);
    
    if (!secure || !hasMedia) {
      setCameraError("HTTPS required for camera access.");
    }

    const unsub = storageService.listenStudents(institutionId, (data) => {
      setStudents(data);
      setIsDataLoaded(true);
    });
    return () => unsub();
  }, [institutionId]);

  useEffect(() => {
    let active = true;
    if (isScannerActive) {
      const initScanner = async () => {
        await new Promise(r => setTimeout(r, 600));
        if (!active) return;

        try {
          const Html5Qrcode = (window as any).Html5Qrcode;
          if (!Html5Qrcode) {
            setCameraError("Scanner library not loaded.");
            setIsScannerActive(false);
            return;
          }

          const element = document.getElementById("qr-reader-attendance");
          if (!element) return;

          scannerRef.current = new Html5Qrcode("qr-reader-attendance");
          
          const config = { 
            fps: 20, 
            qrbox: (w: number, h: number) => {
              const size = Math.min(w, h) * 0.75;
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
          };

          await scannerRef.current.start(
            { facingMode: "environment" },
            config,
            (decodedText: string) => {
              if (statusRef.current === 'IDLE') handleScan(decodedText);
            }
          );
        } catch (err: any) {
          console.error("Camera error:", err);
          if (active) {
            setIsScannerActive(false);
            setCameraError(err.name === 'NotAllowedError' ? "Permission Denied" : "Hardware busy or unavailable.");
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
            scannerRef.current.stop().then(() => {
              scannerRef.current.clear();
            }).catch(() => {});
          }
        } catch (e) {}
      }
    };
  }, [isScannerActive]);

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
        const attendance = await storageService.getAttendance(institutionId);
        const alreadyMarked = attendance.some(a => a.studentId === student.id && a.date === today);

        if (alreadyMarked) {
          setStatus('SUCCESS');
          audioService.speak(`${student.name} is present.`);
          setTimeout(() => setStatus('IDLE'), 2000);
          return;
        }

        const entryId = await storageService.addAttendance(institutionId, {
          id: '',
          institutionId,
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
          audioService.speak(`Welcome ${student.name}`);
          setTimeout(() => setStatus('IDLE'), 2000);
        } else {
          setStatus('GRACE');
          audioService.playWarning();
          audioService.speak(`Not Paid`);
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

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isDataLoaded) return;
    setIsDecodingFile(true);
    try {
      const Html5Qrcode = (window as any).Html5Qrcode;
      const html5QrCode = new Html5Qrcode("render-buffer", false);
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScan(decodedText);
    } catch (err) {
      audioService.playError();
      alert("No valid QR code found in photo.");
    } finally {
      setIsDecodingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-12 pb-20">
      <header className="text-center animate-in fade-in duration-700 pt-4 px-4">
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic leading-none text-white">Attendance</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[9px] mt-2 flex items-center justify-center gap-2">
          <Zap size={10} className="text-blue-500 fill-blue-500" />
          Optical Identity Gate
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
        <div className={`relative rounded-[3rem] overflow-hidden border-4 transition-all duration-300 shadow-3xl bg-slate-900 aspect-square flex flex-col items-center justify-center ${
          status === 'SUCCESS' ? 'border-emerald-500 shadow-emerald-500/20' : 
          status === 'GRACE' ? 'border-amber-500 shadow-amber-500/20' : 
          status === 'ERROR' ? 'border-rose-500 shadow-rose-500/20' : 
          'border-slate-800'
        }`}>
          {!isScannerActive ? (
            <div className="p-8 space-y-8 w-full text-center">
              {!isSecure ? (
                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-3xl flex flex-col items-center gap-3">
                  <ShieldAlert size={32} className="text-rose-500" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">Security Check: HTTPS required.</p>
                </div>
              ) : (
                <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex items-center gap-4 text-left">
                  <Smartphone size={24} className="text-blue-500 flex-shrink-0" />
                  <p className="text-[9px] font-black uppercase text-slate-400 leading-relaxed">Present student QR code to the lens.</p>
                </div>
              )}

              <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                {isSecure && (
                  <button onClick={() => setIsScannerActive(true)} className="bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 border-b-4 border-blue-800 active:translate-y-1 transition-all">
                    <ScanQrCode size={18} />
                    Open Live Lens
                  </button>
                )}
                <div className="relative">
                  <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileScan} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isDecodingFile} className="w-full bg-slate-800 text-slate-300 p-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 border-b-4 border-slate-700">
                    {isDecodingFile ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                    Capture Photo
                  </button>
                </div>
              </div>
              {cameraError && <p className="text-rose-500 font-black uppercase text-[8px] tracking-widest">{cameraError}</p>}
            </div>
          ) : (
            <div className="relative w-full h-full bg-black">
              <div id="qr-reader-attendance" className="w-full h-full"></div>
              <button onClick={() => setIsScannerActive(false)} className="absolute top-4 right-4 z-30 bg-slate-950/90 p-4 rounded-2xl text-white border border-slate-800 shadow-2xl">
                <X size={20} />
              </button>
              {status !== 'IDLE' && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-20">
                  {status === 'PROCESSING' && <Loader2 className="animate-spin text-blue-500" size={60} />}
                  {status === 'SUCCESS' && <Check className="text-emerald-500" size={80} strokeWidth={4} />}
                  {status === 'ERROR' && <X className="text-rose-500" size={80} strokeWidth={4} />}
                  {status === 'GRACE' && <AlertTriangle className="text-amber-500" size={80} strokeWidth={4} />}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
            <h3 className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-600 mb-6 flex items-center gap-3">
              <UserCheck size={14} className="text-blue-500" />
              Identity Verification
            </h3>
            {lastStudent ? (
              <div className="animate-in zoom-in duration-500">
                <p className="text-3xl font-black text-white uppercase italic leading-none mb-2">{lastStudent.name}</p>
                <div className={`text-[10px] font-black uppercase flex items-center gap-2 ${status === 'GRACE' ? 'text-amber-500' : 'text-emerald-500'}`}>
                   <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                   {status === 'GRACE' ? 'PAYMENT PENDING' : 'Verified Access'}
                </div>
                <button onClick={() => { storageService.deleteAttendance(institutionId, lastEntryId!); setRecentRecords(r => r.slice(1)); setLastStudent(null); }} className="mt-6 flex items-center gap-2 bg-slate-800 text-slate-400 px-5 py-2.5 rounded-xl font-black uppercase text-[9px] border border-slate-700">
                  <RotateCcw size={12} /> Invalidate Entry
                </button>
              </div>
            ) : (
              <div className="py-10 opacity-10 text-center">
                <ScanQrCode size={40} className="mx-auto mb-4" />
                <p className="text-xl font-black uppercase tracking-tight italic">Waiting for Scanner</p>
              </div>
            )}
          </div>

          <div className="bg-slate-950 p-8 rounded-[3rem] border border-slate-900 shadow-3xl">
            <h3 className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-600 mb-6 flex items-center gap-3">
              <History size={14} className="text-blue-500" />
              Traffic History
            </h3>
            <div className="space-y-3">
              {recentRecords.map((r, i) => (
                <div key={`${r.id}-${i}`} className="flex justify-between items-center bg-slate-900/30 p-4 rounded-2xl border border-slate-800/30">
                  <div>
                    <span className="font-black text-slate-200 uppercase text-sm block">{r.name}</span>
                    <span className="text-[8px] font-black text-blue-500 uppercase mt-1 block">{r.id}</span>
                  </div>
                  <span className="text-[8px] bg-slate-800 text-slate-400 px-3 py-1 rounded-lg font-black uppercase tracking-widest">{r.grade}</span>
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
