
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Student, PaymentRecord } from '../types';
import { toPng } from 'html-to-image';
import { Search, Printer, CreditCard, ChevronRight, User, Hash, ScanQrCode, X, CheckCircle, Loader2 } from 'lucide-react';

const PaymentDesk: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [lastReceipt, setLastReceipt] = useState<PaymentRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return storageService.listenStudents(setStudents);
  }, []);

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

  const handleProcessPayment = async (student: Student, month: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const payment: PaymentRecord = {
      id: `REC-${Date.now().toString().slice(-6)}`,
      studentId: student.id,
      amount: 2500, 
      month,
      method: 'Cash',
      timestamp: Date.now()
    };

    await storageService.addPayment(payment);
    const updatedStudent = { ...student, lastPaymentMonth: month };
    await storageService.updateStudent(updatedStudent);
    
    setSelectedStudent(updatedStudent);
    setLastReceipt(payment);
    setIsProcessing(false);
    audioService.playCash();
  };

  const handlePrint = async () => {
    if (!lastReceipt || !selectedStudent) return;
    setIsPrinting(true);

    const buffer = document.getElementById('render-buffer');
    const printSection = document.getElementById('print-section');
    if (!buffer || !printSection) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${lastReceipt.id}`;

    // Create a high-quality capture-ready receipt HTML
    buffer.innerHTML = `
      <div id="receipt-capture" style="width: 80mm; padding: 25px; font-family: 'JetBrains Mono', 'Courier New', monospace; color: black; background: white; box-sizing: border-box; text-transform: uppercase; border: 1px dashed #ccc;">
        <center>
          <div style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 5px;">EXCELLENCE ENGLISH</div>
          <div style="font-size: 10px; font-weight: 800; border: 2px solid black; padding: 3px 12px; display: inline-block; border-radius: 4px;">OFFICIAL RECEIPT</div>
          <div style="font-size: 8px; margin-top: 8px; font-weight: 700;">Education Management Network</div>
          <div style="font-size: 10px; margin-top: 15px;">================================</div>
        </center>
        
        <div style="font-size: 11px; margin-top: 15px; line-height: 1.4;">
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span>DATE: ${new Date(lastReceipt.timestamp).toLocaleDateString()}</span>
            <span>TIME: ${new Date(lastReceipt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div style="margin-top: 5px;">RECEIPT ID: <span style="font-weight: 900;">${lastReceipt.id}</span></div>
          <div>TERMINAL: ELMS-AUTH-78</div>
          
          <div style="font-size: 10px; margin: 15px 0;">--------------------------------</div>
          
          <div style="font-weight: 900; font-size: 12px; margin-bottom: 5px;">STUDENT IDENTIFICATION:</div>
          <div style="font-size: 16px; font-weight: 900; margin: 5px 0;">${selectedStudent.name}</div>
          <div style="font-weight: 700;">STU-ID: ${selectedStudent.id}</div>
          <div style="font-weight: 700;">LEVEL : ${selectedStudent.grade}</div>
          
          <div style="font-size: 10px; margin: 15px 0;">--------------------------------</div>
          
          <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 13px;">
            <span>${lastReceipt.month} TUITION FEES</span>
            <span>LKR 2,500.00</span>
          </div>
          <div style="font-size: 9px; opacity: 0.8; margin-top: 4px;">(Educational Tax Exempt)</div>
          
          <div style="font-size: 10px; margin: 25px 0;">================================</div>
          
          <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 900;">
            <span>TOTAL</span>
            <span>LKR 2,500</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 10px; font-weight: 700;">
            <span>PAYMENT STATUS</span>
            <span>CASH SETTLED</span>
          </div>
          
          <div style="font-size: 10px; margin: 30px 0 15px 0;">********************************</div>
        </div>

        <center>
          <img src="${qrUrl}" style="width: 35mm; height: 35mm; margin: 10px 0;" />
          <div style="font-size: 9.5px; font-weight: 900; margin-top: 8px; letter-spacing: 1px;">VERIFICATION KEY</div>
          <div style="font-size: 8px; font-weight: 900; margin-top: 25px;">EXCELLENCE ENGLISH - SRI LANKA</div>
        </center>
      </div>
    `;

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const target = document.getElementById('receipt-capture');
      if (target) {
        const dataUrl = await toPng(target, { pixelRatio: 2 });
        printSection.innerHTML = `<img src="${dataUrl}" style="width: 80mm;" />`;
        window.print();
        printSection.innerHTML = '';
      }
    } catch (error) {
      console.error('Failed to capture receipt image:', error);
    } finally {
      buffer.innerHTML = '';
      setIsPrinting(false);
    }
  };

  const getUnpaidMonths = (lastPaid: string) => {
    const [year, month] = lastPaid.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return [`${nextYear}-${nextMonth.toString().padStart(2, '0')}`];
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-20">
      <header className="flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">Executive Ledger</h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.4em] mt-2">Financial Station</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <div className="relative group flex-1 w-full max-w-xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-all" size={24} />
          <input 
            placeholder="Search Identity..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[2rem] pl-16 pr-8 py-4 md:py-6 text-xl font-black tracking-tight focus:outline-none focus:border-blue-600 transition-all shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {searchTerm && filteredStudents.length > 0 && !selectedStudent && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-3xl z-50 animate-in fade-in slide-in-from-top-4">
              {filteredStudents.map(s => (
                <button 
                  key={s.id}
                  onClick={() => { setSelectedStudent(s); setSearchTerm(''); }}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-800 rounded-xl transition-all"
                >
                  <div className="text-left">
                    <p className="font-black text-lg uppercase tracking-tight">{s.name}</p>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{s.id}</p>
                  </div>
                  <ChevronRight className="text-slate-700" size={20}/>
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsScanning(true)}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 md:py-6 rounded-2xl flex items-center justify-center gap-4 font-black shadow-lg transition-all transform hover:scale-105 uppercase tracking-tighter text-base md:text-lg"
        >
          <ScanQrCode size={28} />
          Scan Card
        </button>
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-800 space-y-10 shadow-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-4 italic">
                <User className="text-blue-500" size={28}/>
                Verified Profile
              </h3>
              <button onClick={() => { setSelectedStudent(null); setLastReceipt(null); }} className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-slate-700 hover:text-white transition-all shadow-inner">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-blue-500 shadow-inner">
                  <Hash size={36} />
                </div>
                <div>
                  <p className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none mb-1">{selectedStudent.name}</p>
                  <div className="flex items-center gap-3 text-emerald-500 font-black text-xs uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Verified Student
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-inner">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2">Grade</p>
                  <p className="text-2xl font-black tracking-tighter">{selectedStudent.grade}</p>
                </div>
                <div className="bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-inner">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2">Settlement</p>
                  <p className="text-xl font-black text-blue-400 uppercase tracking-tighter">{selectedStudent.lastPaymentMonth}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10 bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-8">Process Billing</p>
              {getUnpaidMonths(selectedStudent.lastPaymentMonth).map(month => (
                <button 
                  key={month}
                  disabled={isProcessing}
                  onClick={() => handleProcessPayment(selectedStudent, month)}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-6 md:p-8 rounded-2xl flex items-center justify-between font-black tracking-tighter transition-all shadow-xl shadow-blue-600/10 group relative overflow-hidden"
                >
                  <div className="relative z-10 flex flex-col items-start">
                    <span className="text-2xl md:text-3xl uppercase leading-none">{month} Settlement</span>
                    <span className="text-[9px] opacity-70 tracking-widest uppercase font-bold mt-1">Tuition fees</span>
                  </div>
                  <div className="relative z-10 flex items-center gap-4">
                    <span className="text-xl md:text-2xl font-black tracking-tight">LKR 2,500</span>
                    <CreditCard size={28} className="group-hover:translate-x-1 transition-transform"/>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
            {lastReceipt ? (
              <div className="bg-white text-slate-950 p-10 md:p-12 rounded-[3.5rem] shadow-3xl space-y-10 relative overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="absolute top-0 right-0 w-32 md:w-40 md:h-40 bg-slate-50 rounded-bl-[6rem]"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <CheckCircle size={32} />
                    </div>
                    <div>
                      <h4 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none">Settled</h4>
                      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Receipt ID: ${lastReceipt.id}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 md:space-y-6 font-mono text-xs md:text-sm border-y-2 border-slate-100 py-10">
                    <div className="flex justify-between"><span>REF ID</span> <span className="font-black">${lastReceipt.id}</span></div>
                    <div className="flex justify-between uppercase"><span>STUDENT</span> <span className="font-black">${selectedStudent.name}</span></div>
                    <div className="flex justify-between text-xl md:text-2xl font-black border-t-2 border-slate-100 pt-8 mt-4"><span>GRAND TOTAL</span> <span>LKR ${lastReceipt.amount.toLocaleString()}.00</span></div>
                  </div>

                  <button 
                    onClick={handlePrint}
                    disabled={isPrinting}
                    className="w-full bg-slate-950 text-white mt-10 py-6 md:py-8 rounded-2xl flex items-center justify-center gap-5 font-black tracking-tighter hover:bg-slate-800 transition-all shadow-3xl uppercase text-lg md:text-xl disabled:opacity-50"
                  >
                    {isPrinting ? <Loader2 size={24} className="animate-spin" /> : <Printer size={28} />}
                    Print Receipt
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900/10 border-4 border-dashed border-slate-800/50 rounded-[3rem] md:rounded-[5rem] flex flex-col items-center justify-center text-slate-800 p-16 md:p-20 text-center">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-900/40 rounded-full flex items-center justify-center mb-10 border border-slate-800/50 shadow-inner">
                  <Printer size={48} className="opacity-20" />
                </div>
                <h4 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic opacity-60">Ledger Station</h4>
                <p className="font-bold uppercase text-[10px] tracking-[0.5em] opacity-30 mt-3">Identity authorization required</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-xl p-6 md:p-10 rounded-[3rem] border border-slate-800 shadow-3xl overflow-hidden relative">
            <button 
              onClick={() => setIsScanning(false)}
              className="absolute top-6 right-6 z-10 w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-slate-700 hover:text-white transition-all shadow-2xl border border-slate-800"
            >
              <X size={28} />
            </button>
            <div className="text-center mb-10">
              <h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Institutional Identity</h3>
              <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[10px] mt-2">Scan Personnel Identity Pass</p>
            </div>
            
            <div className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden border-4 md:border-8 border-slate-800 shadow-3xl">
              <video ref={videoRef} className="w-full h-[400px] md:h-[500px] object-cover scale-x-[-1]" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 md:w-80 md:h-80 border-2 md:border-4 border-blue-600/60 rounded-[3rem] animate-pulse shadow-[0_0_150px_rgba(37,99,235,0.3)]"></div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsScanning(false)}
              className="w-full mt-10 bg-slate-800 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-slate-700 transition-all border border-slate-700 shadow-xl"
            >
              TERMINATE SCANNER
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDesk;
