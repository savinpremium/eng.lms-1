
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
  const [isScannerActive, setIsScannerActive] = useState(false);

  const scannerRef = useRef<any>(null);
  const statusRef = useRef(status);

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

  const startScanner = async () => {
    if (!isDataLoaded) return;
    setCameraError(null);

    try {
      // Use Html5Qrcode from global scope
      const Html5Qrcode = (window as any).Html5Qrcode;
      if (!Html5Qrcode) {
        setCameraError("Scanner library not loaded.");
        return;
      }

      scannerRef.current = new Html5Qrcode("qr-reader-attendance");
      
      const config = { 
        fps: 10, 
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText: string) => {
          if (statusRef.current === 'IDLE') {
            handleScan(decodedText);
          }
        },
        (errorMessage: string) => {
          // Normal behavior: silent while searching
        }
      );
      
      setIsScannerActive(true);
    } catch (err) {
      console.error("Scanner Error:", err);
      setCameraError("Camera permission denied or camera not found.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      setIsScannerActive(false);
    }
  };

  useEffect(() => {
    if (isDataLoaded) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isDataLoaded]);

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
              {/* HTML5 QR Code Mount point */}
              <div id="qr-reader-attendance" className="w-full h-full"></div>

              {!isScannerActive && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-4 z-10">
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
