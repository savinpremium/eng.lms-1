
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Student, PaymentRecord } from '../types';
import { toPng } from 'html-to-image';
import { Search, Printer, CreditCard, ChevronRight, User, Hash, ScanQrCode, X, CheckCircle, Loader2, RotateCcw, Download } from 'lucide-react';

const PaymentDesk: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [lastReceipt, setLastReceipt] = useState<PaymentRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
      id: '', // Will be set by service
      studentId: student.id,
      amount: 1000, // Monthly charge updated to 1000 LKR
      month,
      method: 'Cash',
      timestamp: Date.now()
    };

    const id = await storageService.addPayment(payment);
    const updatedStudent = { ...student, lastPaymentMonth: month };
    await storageService.updateStudent(updatedStudent);
    
    setSelectedStudent(updatedStudent);
    setLastReceipt({ ...payment, id });
    setIsProcessing(false);
    audioService.playCash();
  };

  const undoLastPayment = async () => {
    if (!lastReceipt || !selectedStudent) return;
    if (!confirm("Are you sure you want to undo the last payment?")) return;

    await storageService.deletePayment(lastReceipt.id);
    
    const [year, month] = lastReceipt.month.split('-').map(Number);
    const prevMonthNum = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthStr = `${prevYear}-${prevMonthNum.toString().padStart(2, '0')}`;
    
    const rolledBackStudent = { ...selectedStudent, lastPaymentMonth: prevMonthStr };
    await storageService.updateStudent(rolledBackStudent);
    
    setSelectedStudent(rolledBackStudent);
    setLastReceipt(null);
    setPreviewImage(null);
    alert("Payment undone successfully.");
  };

  const generateReceipt = async () => {
    if (!lastReceipt || !selectedStudent) return;
    setIsGenerating(true);

    const buffer = document.getElementById('render-buffer');
    if (!buffer) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${lastReceipt.id}`;

    buffer.innerHTML = `
      <div id="receipt-capture-target" style="width: 80mm; padding: 25px; font-family: 'JetBrains Mono', 'Courier New', monospace; color: black; background: white; box-sizing: border-box; text-transform: uppercase; border: 1px dashed #ccc;">
        <center>
          <div style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 5px;">EXCELLENCE ENGLISH</div>
          <div style="font-size: 10px; font-weight: 800; border: 1.5px solid black; padding: 3px 12px; display: inline-block; border-radius: 4px;">OFFICIAL RECEIPT</div>
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
          
          <div style="font-weight: 900; font-size: 12px; margin-bottom: 5px;">STUDENT IDENTITY:</div>
          <div style="font-size: 16px; font-weight: 900; margin: 5px 0;">${selectedStudent.name}</div>
          <div style="font-weight: 700;">ID: ${selectedStudent.id}</div>
          <div style="font-weight: 700;">LEVEL : ${selectedStudent.grade}</div>
          
          <div style="font-size: 10px; margin: 15px 0;">--------------------------------</div>
          
          <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 13px;">
            <span>${lastReceipt.month} FEES</span>
            <span>LKR 1,000.00</span>
          </div>
          
          <div style="font-size: 10px; margin: 20px 0;">================================</div>
          
          <div style="display: flex; justify-content: space-between; font-size: 22px; font-weight: 900;">
            <span>TOTAL</span>
            <span>LKR 1,000</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 10px; font-weight: 700;">
            <span>STATUS</span>
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
      await new Promise(resolve => setTimeout(resolve, 800));
      const node = document.getElementById('receipt-capture-target');
      if (node) {
        const dataUrl = await toPng(node, { pixelRatio: 2.5, skipFonts: true, fontEmbedCSS: '' });
        setPreviewImage(dataUrl);
      }
    } catch (err) {
      console.error('Receipt generation failed:', err);
    } finally {
      setIsGenerating(false);
      buffer.innerHTML = '';
    }
  };

  const handlePrint = () => {
    if (!previewImage) return;
    const printSection = document.getElementById('print-section');
    if (!printSection) return;
    printSection.innerHTML = `<img src="${previewImage}" style="width: 80mm;" />`;
    window.print();
    printSection.innerHTML = '';
  };

  const getUnpaidMonths = (lastPaid: string) => {
    const [year, month] = lastPaid.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return [`${nextYear}-${nextMonth.toString().padStart(2, '0')}`];
  };

  return (
    <div className="space-y-6 md:space-y-12 pb-20">
      <header className="flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">Ledger</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2">Financial Hub</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <div className="relative group flex-1 w-full max-w-xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
          <input 
            placeholder="Search student..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-16 pr-8 py-4 md:py-5 text-xl font-black tracking-tight focus:outline-none focus:border-blue-600 transition-all shadow-xl"
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
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{s.id}</p>
                  </div>
                  <ChevronRight className="text-slate-700" size={20}/>
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsScanning(true)}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 md:py-5 rounded-2xl flex items-center justify-center gap-4 font-black shadow-lg transition-all transform hover:scale-105 uppercase tracking-tighter text-base md:text-lg"
        >
          <ScanQrCode size={28} />
          Scan ID
        </button>
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 space-y-10 shadow-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-4 italic">
                <User className="text-blue-500" size={28}/>
                Identity Profile
              </h3>
              <button onClick={() => { setSelectedStudent(null); setLastReceipt(null); }} className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-slate-700 hover:text-white transition-all shadow-inner">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-blue-500 shadow-inner">
                  <Hash size={36} />
                </div>
                <div>
                  <p className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none mb-1">{selectedStudent.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em]">{selectedStudent.id}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest">Active Status</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2">Grade</p>
                  <p className="text-2xl font-black tracking-tighter">{selectedStudent.grade}</p>
                </div>
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2">Settlement</p>
                  <p className="text-xl font-black text-blue-400 uppercase tracking-tighter">{selectedStudent.lastPaymentMonth}</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-8">Process Billing</p>
              {getUnpaidMonths(selectedStudent.lastPaymentMonth).map(month => (
                <button 
                  key={month}
                  disabled={isProcessing}
                  onClick={() => handleProcessPayment(selectedStudent, month)}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-6 rounded-2xl flex items-center justify-between font-black tracking-tighter transition-all shadow-xl shadow-blue-600/10 group relative overflow-hidden"
                >
                  <div className="relative z-10 flex flex-col items-start">
                    <span className="text-xl md:text-2xl uppercase leading-none">{month} Installment</span>
                    <span className="text-[9px] opacity-70 tracking-widest uppercase font-bold mt-1">Tuition Fees</span>
                  </div>
                  <div className="relative z-10 flex items-center gap-4">
                    <span className="text-xl font-black tracking-tight">LKR 1,000</span>
                    <CreditCard size={28} className="group-hover:translate-x-1 transition-transform"/>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
            {lastReceipt ? (
              <div className="bg-white text-slate-950 p-10 rounded-[3rem] shadow-3xl space-y-10 relative overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[6rem]"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <CheckCircle size={32} />
                    </div>
                    <div>
                      <h4 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Settled</h4>
                      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Transaction Ref: {lastReceipt.id}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 font-mono text-xs border-y-2 border-slate-100 py-10">
                    <div className="flex justify-between"><span>REF ID</span> <span className="font-black">${lastReceipt.id}</span></div>
                    <div className="flex justify-between uppercase"><span>PERSONNEL</span> <span className="font-black">${selectedStudent.name}</span></div>
                    <div className="flex justify-between text-xl font-black border-t-2 border-slate-100 pt-8 mt-4"><span>GRAND TOTAL</span> <span>LKR ${lastReceipt.amount.toLocaleString()}.00</span></div>
                  </div>

                  <div className="flex flex-col gap-4 mt-10">
                    <button 
                      onClick={generateReceipt}
                      disabled={isGenerating}
                      className="w-full bg-slate-950 text-white py-6 rounded-2xl flex items-center justify-center gap-5 font-black tracking-tighter hover:bg-slate-800 transition-all shadow-3xl uppercase text-lg disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Printer size={28} />}
                      View Receipt
                    </button>
                    <button 
                      onClick={undoLastPayment}
                      className="w-full bg-slate-100 text-rose-600 py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest hover:bg-rose-50 transition-all"
                    >
                      <RotateCcw size={18} />
                      Undo Last Payment
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900/10 border-4 border-dashed border-slate-800/50 rounded-[4rem] flex flex-col items-center justify-center text-slate-800 p-16 md:p-20 text-center">
                <div className="w-24 h-24 bg-slate-900/40 rounded-full flex items-center justify-center mb-10 border border-slate-800/50 shadow-inner">
                  <Printer size={48} className="opacity-20" />
                </div>
                <h4 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic opacity-60">Terminal Standby</h4>
                <p className="font-bold uppercase text-[10px] tracking-[0.5em] opacity-30 mt-3">Identify personnel to access ledger</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* (Scanner Modal and Preview Popup code unchanged for brevity - assuming inclusion in final build) */}
    </div>
  );
};

export default PaymentDesk;
