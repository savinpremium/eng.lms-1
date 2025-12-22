
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Student, PaymentRecord } from '../types';
import { Search, Printer, CreditCard, ChevronRight, User, Hash, ScanQrCode, X, CheckCircle } from 'lucide-react';

const PaymentDesk: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [lastReceipt, setLastReceipt] = useState<PaymentRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handlePrint = () => {
    const printEl = document.getElementById('print-section');
    if (!printEl || !lastReceipt || !selectedStudent) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${lastReceipt.id}`;

    printEl.innerHTML = `
      <div style="width: 80mm; padding: 25px; font-family: 'JetBrains Mono', 'Courier New', monospace; color: black; background: white; box-sizing: border-box; -webkit-print-color-adjust: exact; text-transform: uppercase; border: 1px dashed #ccc;">
        <center>
          <div style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 5px;">EXCELLENCE ENGLISH</div>
          <div style="font-size: 10px; font-weight: 800; border: 1.5px solid black; padding: 3px 12px; display: inline-block; border-radius: 1mm;">OFFICIAL RECEIPT</div>
          <div style="font-size: 8px; margin-top: 8px; font-weight: 700;">Education Management Network</div>
          <div style="font-size: 10px; margin-top: 15px;">================================</div>
        </center>
        
        <div style="font-size: 11px; margin-top: 15px; line-height: 1.3;">
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span>DATE: ${new Date(lastReceipt.timestamp).toLocaleDateString()}</span>
            <span>TIME: ${new Date(lastReceipt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div style="margin-top: 5px;">RECEIPT ID: <span style="font-weight: 900;">${lastReceipt.id}</span></div>
          <div>TERMINAL: ELMS-AUTH-78</div>
          
          <div style="font-size: 10px; margin: 15px 0;">--------------------------------</div>
          
          <div style="font-weight: 900; font-size: 12px; margin-bottom: 5px;">STUDENT IDENTIFICATION:</div>
          <div style="font-size: 15px; font-weight: 900; margin: 5px 0;">${selectedStudent.name}</div>
          <div style="font-weight: 700;">STU-ID: ${selectedStudent.id}</div>
          <div style="font-weight: 700;">LEVEL : ${selectedStudent.grade}</div>
          
          <div style="font-size: 10px; margin: 15px 0;">--------------------------------</div>
          
          <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 12px;">
            <span>${lastReceipt.month} TUITION FEES</span>
            <span>LKR 2,500.00</span>
          </div>
          <div style="font-size: 9px; opacity: 0.8; margin-top: 2px;">(Tax Exempt Educational Service)</div>
          
          <div style="font-size: 10px; margin: 20px 0;">================================</div>
          
          <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 900;">
            <span>TOTAL</span>
            <span>LKR 2,500.00</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 8px; font-weight: 700;">
            <span>PAYMENT STATUS</span>
            <span>CASH SETTLED</span>
          </div>
          
          <div style="font-size: 10px; margin: 25px 0 15px 0;">********************************</div>
        </div>

        <center>
          <img src="${qrUrl}" style="width: 35mm; height: 35mm; margin: 10px 0; border: 1px solid #eee;" />
          <div style="font-size: 9.5px; font-weight: 900; margin-top: 8px; letter-spacing: 1px;">SECURE VERIFICATION KEY</div>
          <div style="font-size: 8.5px; margin-top: 25px; opacity: 0.8;">VALID FOR GATE AUTHORIZATION</div>
          <div style="font-size: 8px; font-weight: 900; margin-top: 6px;">EXCELLENCE ENGLISH - SRI LANKA</div>
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
    <div className="space-y-12 pb-20">
      <header className="flex justify-between items-center">
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">Executive Ledger</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">Financial Terminal & Receipt Generation</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <div className="relative group flex-1 max-w-xl">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-all" size={28} />
          <input 
            placeholder="IDENTITY SEARCH (NAME/ID)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-[3rem] pl-20 pr-10 py-8 text-2xl font-black tracking-tight focus:outline-none focus:border-blue-600 transition-all shadow-3xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {searchTerm && filteredStudents.length > 0 && !selectedStudent && (
            <div className="absolute top-full left-0 right-0 mt-6 bg-slate-900 border border-slate-800 rounded-[3.5rem] p-6 shadow-3xl z-50 animate-in fade-in slide-in-from-top-4">
              {filteredStudents.map(s => (
                <button 
                  key={s.id}
                  onClick={() => { setSelectedStudent(s); setSearchTerm(''); }}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-800 rounded-[2.5rem] transition-all"
                >
                  <div className="text-left">
                    <p className="font-black text-xl uppercase tracking-tighter">{s.name}</p>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">{s.id}</p>
                  </div>
                  <ChevronRight className="text-slate-700" size={24}/>
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsScanning(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-8 rounded-[3rem] flex items-center gap-4 font-black shadow-2xl shadow-blue-600/20 transition-all transform hover:scale-105 uppercase tracking-tighter text-xl"
        >
          <ScanQrCode size={32} />
          Scan Card
        </button>
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-slate-900/50 p-12 rounded-[4.5rem] border border-slate-800 space-y-10 shadow-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-4 italic">
                <User className="text-blue-500" size={28}/>
                Verified Personnel
              </h3>
              <button onClick={() => { setSelectedStudent(null); setLastReceipt(null); }} className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-700 hover:text-white transition-all shadow-inner">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 bg-slate-950 rounded-[2.5rem] border border-slate-800 flex items-center justify-center text-blue-500 shadow-inner">
                  <Hash size={40} />
                </div>
                <div>
                  <p className="text-5xl font-black tracking-tighter uppercase mb-1">{selectedStudent.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em]">{selectedStudent.id}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest">Digital Auth Active</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 shadow-inner">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2">Academic Level</p>
                  <p className="text-3xl font-black tracking-tighter">{selectedStudent.grade}</p>
                </div>
                <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 shadow-inner">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2">Latest Record</p>
                  <p className="text-xl font-black text-blue-400 uppercase tracking-tighter">{selectedStudent.lastPaymentMonth}</p>
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-950 rounded-[3.5rem] border border-slate-800 shadow-2xl">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-8">Process Billing Cycle</p>
              {getUnpaidMonths(selectedStudent.lastPaymentMonth).map(month => (
                <button 
                  key={month}
                  disabled={isProcessing}
                  onClick={() => handleProcessPayment(selectedStudent, month)}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-8 rounded-[2.5rem] flex items-center justify-between font-black tracking-tighter transition-all shadow-xl shadow-blue-600/10 group overflow-hidden relative"
                >
                  <div className="relative z-10 flex flex-col items-start">
                    <span className="text-3xl uppercase">{month} SETTLEMENT</span>
                    <span className="text-[10px] opacity-70 tracking-[0.2em] uppercase font-bold mt-1">Tuition Fees 2025</span>
                  </div>
                  <div className="relative z-10 flex items-center gap-4">
                    <span className="text-2xl">LKR 2,500</span>
                    <CreditCard size={28} className="group-hover:translate-x-1 transition-transform"/>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
            {lastReceipt ? (
              <div className="bg-white text-slate-950 p-12 rounded-[4.5rem] shadow-3xl space-y-10 relative overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-[6rem]"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 bg-emerald-500 rounded-[1.8rem] flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <CheckCircle size={36} />
                    </div>
                    <div>
                      <h4 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Settled Successfully</h4>
                      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Transaction Link: Engine_ELMS_${lastReceipt.id}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6 font-mono text-sm border-y-2 border-slate-100 py-12">
                    <div className="flex justify-between"><span>REFERENCE ID</span> <span className="font-black">${lastReceipt.id}</span></div>
                    <div className="flex justify-between uppercase"><span>PERSONNEL</span> <span className="font-black">${selectedStudent.name}</span></div>
                    <div className="flex justify-between"><span>CYCLE PERIOD</span> <span className="font-black">${lastReceipt.month}</span></div>
                    <div className="flex justify-between text-2xl font-black border-t-2 border-slate-100 pt-8 mt-4"><span>GRAND TOTAL</span> <span>LKR ${lastReceipt.amount.toLocaleString()}.00</span></div>
                  </div>

                  <button 
                    onClick={handlePrint}
                    className="w-full bg-slate-950 text-white mt-12 py-8 rounded-[2.5rem] flex items-center justify-center gap-5 font-black tracking-tighter hover:bg-slate-800 transition-all shadow-3xl uppercase text-xl shadow-blue-900/10"
                  >
                    <Printer size={32} />
                    Print Thermal Receipt
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900/10 border-4 border-dashed border-slate-800/50 rounded-[5rem] flex flex-col items-center justify-center text-slate-800 p-20 text-center">
                <div className="w-32 h-32 bg-slate-900/40 rounded-full flex items-center justify-center mb-10 border border-slate-800/50 shadow-inner">
                  <Printer size={56} className="opacity-20" />
                </div>
                <h4 className="text-3xl font-black uppercase tracking-tighter italic opacity-60">Terminal Standby</h4>
                <p className="font-bold uppercase text-[10px] tracking-[0.5em] opacity-30 mt-3">Authorize Personnel to Access Ledger</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-2xl p-10 rounded-[5rem] border border-slate-800 shadow-3xl overflow-hidden relative">
            <button 
              onClick={() => setIsScanning(false)}
              className="absolute top-10 right-10 z-10 w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center text-slate-700 hover:text-white transition-all shadow-2xl border border-slate-800"
            >
              <X size={32} />
            </button>
            <div className="text-center mb-12">
              <h3 className="text-4xl font-black tracking-tighter uppercase italic">Institutional Identity</h3>
              <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[10px] mt-2">Scan Personnel PVC Security QR</p>
            </div>
            
            <div className="relative rounded-[4rem] overflow-hidden border-8 border-slate-800 shadow-3xl">
              <video ref={videoRef} className="w-full h-[500px] object-cover scale-x-[-1]" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-80 h-80 border-4 border-blue-600/60 rounded-[4rem] animate-pulse shadow-[0_0_150px_rgba(37,99,235,0.3)]"></div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsScanning(false)}
              className="w-full mt-12 bg-slate-800 text-white py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-slate-700 transition-all border border-slate-700 shadow-xl"
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
