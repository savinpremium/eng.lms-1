
import React, { useState, useRef, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Student } from '../types';
import { Search, CreditCard, ChevronLeft, ScanQrCode, X, Loader2, Check } from 'lucide-react';
import { audioService } from '../services/audioService';

const StudentPortal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [searchId, setSearchId] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [scanStatus, setScanStatus] = useState<'IDLE' | 'READ'>('IDLE');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<number | null>(null);

  const startScanner = async () => {
    setIsScanning(true);
    setScanStatus('IDLE');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        loopRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsScanning(false);
  };

  const tick = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
      if (ctx) {
        const v = videoRef.current;
        const w = 400;
        const h = (v.videoHeight / v.videoWidth) * w;
        canvas.width = w;
        canvas.height = h;
        
        ctx.drawImage(v, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // HIGH CONTRAST BINARIZATION FOR SELFIE CAM
        for (let i = 0; i < data.length; i += 4) {
          const luma = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
          const bin = luma > 120 ? 255 : 0;
          data[i] = data[i+1] = data[i+2] = bin;
        }

        if ((window as any).jsQR) {
          const code = (window as any).jsQR(data, w, h, { inversionAttempts: "attemptBoth" });
          if (code && code.data) {
            const raw = code.data.trim().toUpperCase();
            const match = raw.match(/(STU-\d{4}-\d{4})/);
            const foundId = match ? match[1] : (raw.startsWith('STU-') ? raw : null);
            
            if (foundId) {
              setScanStatus('READ');
              audioService.playTone(800, 'sine', 0.1);
              verifyId(foundId);
              stopScanner();
              return;
            }
          }
        }
      }
    }
    if (isScanning) loopRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const verifyId = async (id: string) => {
    setIsSearching(true);
    const studentsList = await storageService.getStudents();
    const found = studentsList.find(s => s.id.toUpperCase() === id.toUpperCase());
    if (found) {
      setStudent(found);
      audioService.playSuccess();
    } else {
      audioService.playError();
      alert("Identifier not found in institutional database.");
    }
    setIsSearching(false);
  };

  const handleSearch = () => verifyId(searchId);

  const handleOfficePay = async () => {
    const isValid = await storageService.validateOTP(authCode);
    if (isValid) {
      alert("Authorization Confirmed. Proceed to desk.");
      setShowPayModal(false);
    } else {
      alert("Invalid Security Code.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-20">
      <header className="flex items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <button onClick={onBack} className="w-16 h-16 rounded-[1.8rem] bg-slate-900 flex items-center justify-center hover:bg-slate-800 transition-all border border-slate-800">
          <ChevronLeft size={28}/>
        </button>
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none mb-1">Student Hub</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">Personal Academic Dashboard</p>
        </div>
      </header>

      {!student ? (
        <div className="bg-slate-900 p-12 rounded-[5rem] border border-slate-800 shadow-3xl space-y-10 animate-in zoom-in-95 duration-500">
          <div>
            <label className="block text-[10px] font-black tracking-[0.6em] uppercase text-slate-600 mb-6 text-center">Verify Identity</label>
            <div className="flex flex-col gap-4">
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-10 py-6 text-3xl font-black tracking-tight focus:outline-none focus:border-blue-600 uppercase text-center shadow-inner transition-all text-white"
                placeholder="STU-2025-XXXX"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-6 rounded-3xl font-black tracking-tighter text-2xl transition-all shadow-xl border border-slate-700 uppercase"
              >
                {isSearching ? 'Synchronizing...' : 'Search Record'}
              </button>
            </div>
          </div>

          <div className="relative flex items-center gap-6 py-6">
            <div className="flex-1 h-[1px] bg-slate-800"></div>
            <span className="text-[10px] font-black uppercase text-slate-700 tracking-[0.5em]">OR SCAN PASS</span>
            <div className="flex-1 h-[1px] bg-slate-800"></div>
          </div>

          <button 
            onClick={startScanner}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-10 rounded-[4rem] flex flex-col items-center gap-6 transition-all shadow-2xl active:scale-95 group"
          >
            <ScanQrCode size={64} className="group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-black uppercase tracking-tighter italic">Turbo Scan Active</span>
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
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 w-full">
              <div className="bg-slate-50 p-8 rounded-[2.8rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Level</p>
                <p className="text-2xl font-black tracking-tighter">{student.grade}</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.8rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Registry</p>
                <p className="text-2xl font-black text-emerald-600 uppercase italic">Verified</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 p-12 rounded-[5rem] shadow-3xl">
            <h3 className="text-3xl font-black tracking-tighter uppercase italic mb-10 text-white">Class Fee Station</h3>

            <div className="p-10 bg-slate-950 rounded-[3.5rem] border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 shadow-inner">
              <div className="text-center md:text-left">
                <p className="font-black text-2xl tracking-tighter uppercase text-white">Monthly Tuition</p>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mt-1">Last Updated: {student.lastPaymentMonth}</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-4xl font-black tracking-tighter italic text-white">LKR 1,000</p>
                <button 
                  onClick={() => setShowPayModal(true)}
                  className="text-blue-500 font-black uppercase text-[10px] tracking-[0.3em] mt-4 hover:text-blue-400 transition-all flex items-center justify-center md:justify-end gap-2"
                >
                  <CreditCard size={14}/>
                  Authorize Settlement
                </button>
              </div>
            </div>
          </div>
          
          <button onClick={() => setStudent(null)} className="w-full py-6 text-slate-600 font-black uppercase text-[10px] tracking-[0.6em] hover:text-white transition-all">
            End Session
          </button>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-sm p-10 rounded-[4rem] border border-slate-800 shadow-3xl space-y-8 animate-in zoom-in duration-300 text-center">
            <h4 className="text-3xl font-black tracking-tighter uppercase italic text-white">Desk Sync</h4>
            <input 
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 text-4xl font-black tracking-[0.4em] focus:border-blue-600 focus:outline-none text-center shadow-inner text-white"
              maxLength={4}
              placeholder="----"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, ''))}
            />
            <button 
              onClick={handleOfficePay}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20"
            >
              Confirm Auth
            </button>
            <button onClick={() => setShowPayModal(false)} className="w-full text-slate-600 font-black uppercase text-[9px] tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-xl p-8 rounded-[4rem] border border-slate-800 shadow-3xl overflow-hidden relative">
            <button onClick={stopScanner} className="absolute top-6 right-6 z-10 w-12 h-12 bg-slate-950 rounded-full flex items-center justify-center text-slate-700 hover:text-white border border-slate-800">
              <X size={28} />
            </button>
            <div className="text-center mb-10">
              <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-white">Identity Scan</h3>
              <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[10px] mt-2">Environment Neutral Capture</p>
            </div>
            <div className="relative rounded-[3rem] overflow-hidden border-8 border-slate-800 bg-black">
              <video ref={videoRef} className="w-full h-[400px] object-cover scale-x-[-1]" playsInline />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-64 h-64 border-2 border-blue-600/60 rounded-[3rem] ${scanStatus === 'READ' ? 'bg-emerald-500/20 border-emerald-500' : 'animate-pulse'}`}>
                   {scanStatus === 'READ' && <Check size={48} className="text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortal;
