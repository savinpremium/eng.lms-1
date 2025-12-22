
import React, { useState, useRef, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Student } from '../types';
import { Search, CreditCard, ChevronLeft, ScanQrCode, X, ShieldCheck } from 'lucide-react';
import { audioService } from '../services/audioService';

const StudentPortal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [searchId, setSearchId] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    if (!isScanning) return;

    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        setIsScanning(false);
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

          if (code && code.data && code.data.startsWith('STU-')) {
            verifyId(code.data);
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startScanner();
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning]);

  const verifyId = async (id: string) => {
    setIsSearching(true);
    const students = await storageService.getStudents();
    const found = students.find(s => s.id.toUpperCase() === id.toUpperCase());
    if (found) {
      setStudent(found);
      setIsScanning(false);
      audioService.playSuccess();
    } else {
      audioService.playError();
    }
    setIsSearching(false);
  };

  const handleSearch = () => verifyId(searchId);

  const handleOfficePay = async () => {
    const isValid = await storageService.validateOTP(authCode);
    if (isValid) {
      alert("Verification successful! Please complete the cash handover at the desk.");
      setShowPayModal(false);
    } else {
      alert("Invalid Authorization Code.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-20">
      <header className="flex items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <button onClick={onBack} className="w-16 h-16 rounded-[1.8rem] bg-slate-900 flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl shadow-blue-900/5">
          <ChevronLeft size={28}/>
        </button>
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none mb-1">Self Service</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">Personal Data Management Network</p>
        </div>
      </header>

      {!student ? (
        <div className="bg-slate-900 p-12 rounded-[5rem] border border-slate-800 shadow-3xl space-y-10 animate-in zoom-in-95 duration-500">
          <div>
            <label className="block text-[10px] font-black tracking-[0.6em] uppercase text-slate-600 mb-6 text-center">Identity Input</label>
            <div className="flex flex-col gap-4">
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-10 py-6 text-3xl font-black tracking-tight focus:outline-none focus:border-blue-600 uppercase text-center shadow-inner transition-all"
                placeholder="STU-2025-XXXX"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-6 rounded-3xl font-black tracking-tighter text-2xl transition-all shadow-xl border border-slate-700"
              >
                {isSearching ? 'VERIFYING...' : 'FIND RECORD'}
              </button>
            </div>
          </div>

          <div className="relative flex items-center gap-6 py-6">
            <div className="flex-1 h-[1px] bg-slate-800"></div>
            <span className="text-[10px] font-black uppercase text-slate-700 tracking-[0.5em]">OR SCAN PASS</span>
            <div className="flex-1 h-[1px] bg-slate-800"></div>
          </div>

          <button 
            onClick={() => setIsScanning(true)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-10 rounded-[4rem] flex flex-col items-center gap-6 transition-all shadow-2xl shadow-blue-600/20 active:scale-95"
          >
            <ScanQrCode size={64} />
            <span className="text-2xl font-black uppercase tracking-tighter italic">Activate Scanner</span>
          </button>
        </div>
      ) : (
        <div className="space-y-10 animate-in zoom-in-95 duration-500">
          <div className="bg-white text-slate-950 p-16 rounded-[5.5rem] shadow-3xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            <div className="w-56 h-56 bg-slate-50 rounded-[4rem] flex items-center justify-center mb-10 border-4 border-slate-100 shadow-inner">
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${student.id}`} alt="QR" className="w-40 h-40" />
            </div>
            <h2 className="text-5xl font-black tracking-tighter mb-2 italic uppercase">{student.name}</h2>
            <div className="flex items-center gap-4 mb-10">
               <span className="text-blue-600 font-black tracking-[0.5em] uppercase text-xs">{student.id}</span>
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 w-full">
              <div className="bg-slate-50 p-8 rounded-[2.8rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Academic Grade</p>
                <p className="text-2xl font-black tracking-tighter">{student.grade}</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.8rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Auth Status</p>
                <p className="text-2xl font-black text-emerald-600 uppercase italic">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 p-12 rounded-[5rem] shadow-3xl">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-3xl font-black tracking-tighter uppercase italic">Billing Log</h3>
              <div className="px-5 py-2 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Sync Data</div>
            </div>

            <div className="p-10 bg-slate-950 rounded-[3.5rem] border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 shadow-inner">
              <div className="text-center md:text-left">
                <p className="font-black text-2xl tracking-tighter uppercase">Tuition Fee</p>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mt-1">Due Cycle: {student.lastPaymentMonth}</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-4xl font-black tracking-tighter italic">LKR 1,000</p>
                <button 
                  onClick={() => setShowPayModal(true)}
                  className="text-blue-500 font-black uppercase text-[10px] tracking-[0.3em] mt-4 hover:text-blue-400 transition-all flex items-center justify-center md:justify-end gap-2"
                >
                  <CreditCard size={14}/>
                  Authorize at Office
                </button>
              </div>
            </div>
          </div>
          
          <button onClick={() => setStudent(null)} className="w-full py-6 text-slate-600 font-black uppercase text-[10px] tracking-[0.6em] hover:text-white transition-all">
            Terminate Session
          </button>
        </div>
      )}
      {/* (Modal code unchanged) */}
    </div>
  );
};

export default StudentPortal;
