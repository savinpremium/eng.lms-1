
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Student, PaymentRecord } from '../types';
import { Search, Printer, CreditCard, ChevronRight, User, Hash, ScanQrCode, X } from 'lucide-react';

const PaymentDesk: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [lastReceipt, setLastReceipt] = useState<PaymentRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const students = storageService.getStudents();
  
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return [];
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, students]);

  useEffect(() => {
    let animationFrameId: number;
    if (!isScanning) return;

    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
            const found = students.find(s => s.id === code.data);
            if (found) {
              setSelectedStudent(found);
              setIsScanning(false);
              audioService.playSuccess();
              // Stop camera
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
  }, [isScanning, students]);

  const handleProcessPayment = (student: Student, month: string) => {
    const payment: PaymentRecord = {
      id: `REC-${Date.now()}`,
      studentId: student.id,
      amount: 2500, 
      month,
      method: 'Cash',
      timestamp: Date.now()
    };

    storageService.addPayment(payment);
    const updatedStudent = { ...student, lastPaymentMonth: month };
    storageService.updateStudent(updatedStudent);
    
    setSelectedStudent(updatedStudent);
    setLastReceipt(payment);
    audioService.playCash();
  };

  const handlePrint = () => {
    const printEl = document.getElementById('print-section');
    if (!printEl || !lastReceipt || !selectedStudent) return;

    printEl.innerHTML = `
      <div style="width: 80mm; padding: 10px; font-family: monospace; color: black; background: white; border: 1px dashed #ccc;">
        <center>
          <h2 style="margin: 0; font-weight: 900;">EXCELLENCE ENGLISH</h2>
          <p style="margin: 2px 0; font-size: 10px;">PREMIUM EDUCATION SYSTEM</p>
          <p style="margin: 5px 0;">----------------------------</p>
        </center>
        <div style="font-size: 12px; line-height: 1.5;">
          <p style="margin: 2px 0;"><b>RECEIPT:</b> ${lastReceipt.id}</p>
          <p style="margin: 2px 0;"><b>DATE:</b> ${new Date(lastReceipt.timestamp).toLocaleString()}</p>
          <p style="margin: 2px 0;"><b>STUDENT:</b> ${selectedStudent.name}</p>
          <p style="margin: 2px 0;"><b>ID:</b> ${selectedStudent.id}</p>
          <p style="margin: 2px 0;"><b>GRADE:</b> ${selectedStudent.grade}</p>
          <p style="margin: 5px 0;">----------------------------</p>
          <p style="margin: 2px 0;"><b>SETTLEMENT:</b> ${lastReceipt.month} TUITION</p>
          <p style="margin: 2px 0; font-size: 16px;"><b>TOTAL: LKR ${lastReceipt.amount.toLocaleString()}.00</b></p>
          <p style="margin: 2px 0;"><b>METHOD:</b> ${lastReceipt.method}</p>
          <p style="margin: 5px 0;">----------------------------</p>
        </div>
        <center style="font-size: 10px;">
          <p>Thank you for choosing Excellence!</p>
          <p>KEEP THIS RECEIPT FOR ENTRANCE</p>
        </center>
      </div>
    `;
    window.print();
  };

  const getUnpaidMonths = (lastPaid: string) => {
    const [year, month] = lastPaid.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return [`${nextYear}-${nextMonth.toString().padStart(2, '0')}`];
  };

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase">Executive Ledger</h1>
          <p className="text-slate-500 font-bold">Process monthly tuition fees and print receipts.</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="relative group flex-1 max-w-xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-all" size={24} />
          <input 
            placeholder="SEARCH NAME OR STU-ID..."
            className="w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] pl-16 pr-8 py-6 text-xl font-black tracking-tight focus:outline-none focus:border-blue-600 transition-all shadow-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {searchTerm && filteredStudents.length > 0 && !selectedStudent && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-slate-900 border border-slate-800 rounded-[3rem] p-4 shadow-3xl z-50">
              {filteredStudents.map(s => (
                <button 
                  key={s.id}
                  onClick={() => { setSelectedStudent(s); setSearchTerm(''); }}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-800 rounded-3xl transition-all"
                >
                  <div className="text-left">
                    <p className="font-black text-lg uppercase">{s.name}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.id}</p>
                  </div>
                  <ChevronRight className="text-slate-600" />
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsScanning(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-6 rounded-[2.5rem] flex items-center gap-3 font-black shadow-xl shadow-blue-600/20 transition-all transform hover:scale-105"
        >
          <ScanQrCode size={24} />
          SCAN ID
        </button>
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900/50 p-10 rounded-[4rem] border border-slate-800 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <User className="text-blue-500" />
                Active Profile
              </h3>
              <button onClick={() => { setSelectedStudent(null); setLastReceipt(null); }} className="text-slate-500 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-slate-950 rounded-3xl border border-slate-800 flex items-center justify-center text-blue-500">
                  <Hash size={32} />
                </div>
                <div>
                  <p className="text-4xl font-black tracking-tighter uppercase">{selectedStudent.name}</p>
                  <p className="text-blue-500 font-bold uppercase text-xs tracking-[0.2em]">{selectedStudent.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Grade</p>
                  <p className="text-xl font-black">{selectedStudent.grade}</p>
                </div>
                <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xl font-black text-emerald-500">ACTIVE</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-950 rounded-[3rem] border border-slate-800">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Pending Payments</p>
              {getUnpaidMonths(selectedStudent.lastPaymentMonth).map(month => (
                <button 
                  key={month}
                  onClick={() => handleProcessPayment(selectedStudent, month)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-6 rounded-[2rem] flex items-center justify-between font-black tracking-tighter transition-all shadow-lg shadow-emerald-600/10"
                >
                  <span className="text-2xl uppercase">{month} FEES</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl opacity-80">LKR 2,500</span>
                    <CreditCard size={20} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {lastReceipt ? (
              <div className="bg-white text-slate-950 p-12 rounded-[4rem] shadow-2xl space-y-8 relative overflow-hidden animate-in zoom-in duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-bl-[4rem]"></div>
                <div className="relative">
                  <h4 className="text-3xl font-black tracking-tighter uppercase mb-6">Settled Successfully</h4>
                  
                  <div className="space-y-4 font-mono text-sm border-y border-slate-100 py-6">
                    <div className="flex justify-between"><span>RECEIPT</span> <span>{lastReceipt.id}</span></div>
                    <div className="flex justify-between uppercase"><span>STUDENT</span> <span>{selectedStudent.name}</span></div>
                    <div className="flex justify-between"><span>MONTH</span> <span>{lastReceipt.month}</span></div>
                    <div className="flex justify-between text-xl font-black"><span>TOTAL</span> <span>LKR {lastReceipt.amount.toLocaleString()}.00</span></div>
                  </div>

                  <button 
                    onClick={handlePrint}
                    className="w-full bg-slate-950 text-white mt-8 py-5 rounded-3xl flex items-center justify-center gap-3 font-black tracking-tighter hover:bg-slate-800 transition-all shadow-xl"
                  >
                    <Printer size={20} />
                    GENERATE PHYSICAL RECEIPT
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[4rem] flex flex-col items-center justify-center text-slate-700 p-12 text-center">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                  <Printer size={32} className="opacity-20" />
                </div>
                <p className="text-2xl font-black uppercase tracking-tighter">Ledger Ready</p>
                <p className="font-bold opacity-40">Identify student to process payments</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Scanner Modal for Desk */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-xl p-8 rounded-[4rem] border border-slate-800 shadow-3xl overflow-hidden relative">
            <button 
              onClick={() => setIsScanning(false)}
              className="absolute top-6 right-6 z-10 w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">Identify Student</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Scan PVC Card QR Code</p>
            </div>
            
            <div className="relative rounded-[3rem] overflow-hidden border-4 border-slate-800">
              <video ref={videoRef} className="w-full h-[400px] object-cover scale-x-[-1]" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-blue-500/50 rounded-[3rem] animate-pulse"></div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsScanning(false)}
              className="w-full mt-8 bg-slate-800 text-white py-5 rounded-3xl font-black uppercase tracking-tighter"
            >
              CANCEL SCAN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDesk;
