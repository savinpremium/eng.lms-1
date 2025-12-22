
import React, { useState, useRef, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Student } from '../types';
import { Search, QrCode, CreditCard, ChevronLeft, MapPin, ScanQrCode, X } from 'lucide-react';
import { audioService } from '../services/audioService';

const StudentPortal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [searchId, setSearchId] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

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
        console.error("Camera access denied", err);
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
            const students = storageService.getStudents();
            const found = students.find(s => s.id === code.data);
            if (found) {
              setStudent(found);
              setIsScanning(false);
              audioService.playSuccess();
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
            }
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

  const handleSearch = () => {
    const students = storageService.getStudents();
    const found = students.find(s => s.id.toUpperCase() === searchId.toUpperCase());
    if (found) setStudent(found);
  };

  const handleOfficePay = () => {
    if (storageService.validateOTP(authCode)) {
      alert("Verification successful! Please hand the cash to the desk.");
      setShowPayModal(false);
    } else {
      alert("Invalid Authorization Code.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <header className="flex items-center gap-6">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center hover:bg-slate-800">
          <ChevronLeft />
        </button>
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Student Portal</h1>
          <p className="text-slate-500 font-bold">Access your records via ID or QR scan.</p>
        </div>
      </header>

      {!student ? (
        <div className="bg-slate-900 p-10 rounded-[4rem] border border-slate-800 shadow-2xl space-y-8">
          <div>
            <label className="block text-[10px] font-black tracking-[0.4em] uppercase text-slate-500 mb-4">Manual Entry</label>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                className="flex-1 bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 text-2xl font-black tracking-tight focus:outline-none focus:border-blue-600 uppercase"
                placeholder="STU-2025-..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
              <button 
                onClick={handleSearch}
                className="bg-slate-800 hover:bg-slate-700 text-white px-10 py-5 rounded-3xl font-black tracking-tighter text-xl transition-all"
              >
                FIND
              </button>
            </div>
          </div>

          <div className="relative flex items-center gap-4 py-4">
            <div className="flex-1 h-[1px] bg-slate-800"></div>
            <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">OR USE CAMERA</span>
            <div className="flex-1 h-[1px] bg-slate-800"></div>
          </div>

          <button 
            onClick={() => setIsScanning(true)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-8 rounded-[3rem] flex flex-col items-center gap-3 transition-all shadow-xl shadow-blue-600/10"
          >
            <ScanQrCode size={48} />
            <span className="text-xl font-black uppercase tracking-tighter">Scan ID Card QR</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
          <div className="bg-white text-slate-950 p-10 rounded-[4rem] shadow-2xl flex flex-col items-center text-center">
            <div className="w-48 h-48 bg-slate-100 rounded-[3rem] flex items-center justify-center mb-8 border-2 border-slate-200">
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.id}`} alt="QR" className="w-32 h-32" />
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-2">{student.name}</h2>
            <p className="text-blue-600 font-black tracking-[0.3em] uppercase mb-6">{student.id}</p>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-slate-50 p-6 rounded-[2rem]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Grade</p>
                <p className="text-xl font-black">{student.grade}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Status</p>
                <p className="text-xl font-black text-emerald-600 uppercase">Settled</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[4rem] border border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tighter uppercase">Tuition Log</h3>
              <div className="px-4 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-black uppercase">Institutional Data</div>
            </div>

            <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-slate-800 flex justify-between items-center">
              <div>
                <p className="font-black text-lg">Next Settlement Due</p>
                <p className="text-slate-500 text-sm font-bold">Standard Monthly Fee</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black tracking-tighter">LKR 2,500</p>
                <button 
                  onClick={() => setShowPayModal(true)}
                  className="text-blue-500 font-black uppercase text-xs tracking-widest"
                >
                  SETTLE AT OFFICE
                </button>
              </div>
            </div>
          </div>
          
          <button onClick={() => setStudent(null)} className="w-full py-4 text-slate-600 font-bold uppercase text-xs tracking-widest hover:text-white transition-all">
            Exit Private Record
          </button>
        </div>
      )}

      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/90">
          <div className="bg-slate-900 w-full max-w-xl p-8 rounded-[4rem] border border-slate-800 shadow-3xl overflow-hidden relative text-center">
            <button 
              onClick={() => setIsScanning(false)}
              className="absolute top-6 right-6 z-10 w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">Point Card at Camera</h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-8">Align your ID QR code with the viewer</p>
            
            <div className="relative rounded-[3rem] overflow-hidden border-4 border-blue-600/30">
              <video ref={videoRef} className="w-full h-[400px] object-cover scale-x-[-1]" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-blue-500/50 rounded-[3rem] animate-pulse shadow-[0_0_100px_rgba(37,99,235,0.2)]"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-md p-10 rounded-[4rem] border border-slate-800 shadow-3xl text-center space-y-8 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mx-auto">
              <MapPin size={40} />
            </div>
            <div>
              <h4 className="text-3xl font-black tracking-tighter uppercase">Office Verification</h4>
              <p className="text-slate-500 font-bold">Ask the desk clerk for the 4-digit Personnel Authorization Code.</p>
            </div>
            
            <input 
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-6 text-4xl font-black tracking-[0.5em] text-center focus:outline-none focus:border-blue-600"
              maxLength={4}
              placeholder="0000"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
            />

            <div className="flex flex-col gap-4">
              <button 
                onClick={handleOfficePay}
                className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-tighter text-xl hover:bg-blue-500 shadow-lg shadow-blue-600/20"
              >
                VERIFY SETTLEMENT
              </button>
              <button 
                onClick={() => setShowPayModal(false)}
                className="text-slate-500 font-bold uppercase text-xs tracking-widest"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortal;
