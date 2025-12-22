
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { generateWhatsAppDraft } from '../services/geminiService';
import { Student, PaymentRecord } from '../types';
import { toPng } from 'html-to-image';
import { Search, Printer, CreditCard, ChevronRight, User, Hash, ScanQrCode, X, CheckCircle, Loader2, Download, Sparkles } from 'lucide-react';

const PaymentDesk: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [lastReceipt, setLastReceipt] = useState<PaymentRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingUpdate, setIsSendingUpdate] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerLoopRef = useRef<number | null>(null);

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

  const stopScanner = () => {
    if (scannerLoopRef.current) {
      cancelAnimationFrame(scannerLoopRef.current);
      scannerLoopRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const tick = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if ((window as any).jsQR) {
          const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data && code.data.startsWith('STU-')) {
            const found = students.find(s => s.id === code.data);
            if (found) {
              setSelectedStudent(found);
              audioService.playSuccess();
              stopScanner();
              return;
            }
          }
        }
      }
    }
    if (isScanning) {
      scannerLoopRef.current = requestAnimationFrame(tick);
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error(e));
          scannerLoopRef.current = requestAnimationFrame(tick);
        };
      }
    } catch (err) {
      console.error('Camera access failed', err);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const handleProcessPayment = async (student: Student, month: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const payment: PaymentRecord = {
      id: '', 
      studentId: student.id,
      amount: 1000, 
      month,
      method: 'Cash',
      timestamp: Date.now()
    };

    try {
      const id = await storageService.addPayment(payment);
      const updatedStudent = { ...student, lastPaymentMonth: month };
      await storageService.updateStudent(updatedStudent);
      
      setSelectedStudent(updatedStudent);
      setLastReceipt({ ...payment, id });
      audioService.playCash();
    } catch (e) {
      console.error("Payment failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendDigitalUpdate = async () => {
    if (!selectedStudent || !lastReceipt) return;
    setIsSendingUpdate(true);
    try {
      const draft = await generateWhatsAppDraft(selectedStudent, 'payment_received');
      const phone = selectedStudent.contact.replace(/\D/g, '');
      const waPhone = phone.startsWith('0') ? '94' + phone.substring(1) : phone;
      const encodedText = encodeURIComponent(draft);
      window.open(`https://wa.me/${waPhone}?text=${encodedText}`, '_blank');
    } catch (e) {
      console.error("AI Update failed", e);
    } finally {
      setIsSendingUpdate(false);
    }
  };

  const undoLastPayment = async () => {
    if (!lastReceipt || !selectedStudent) return;
    if (!confirm("Are you sure you want to reverse this class fee entry?")) return;

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
          <div style="font-size: 10px; font-weight: 800; border: 1.5px solid black; padding: 3px 12px; display: inline-block; border-radius: 4px;">CLASS FEE RECEIPT</div>
          <div style="font-size: 8px; margin-top: 8px; font-weight: 700;">Education For Excellence</div>
          <div style="font-size: 10px; margin-top: 15px;">================================</div>
        </center>
        
        <div style="font-size: 11px; margin-top: 15px; line-height: 1.4;">
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span>DATE: ${new Date(lastReceipt.timestamp).toLocaleDateString()}</span>
            <span>TIME: ${new Date(lastReceipt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div style="margin-top: 5px;">ENTRY ID: <span style="font-weight: 900;">${lastReceipt.id}</span></div>
          
          <div style="font-size: 10px; margin: 15px 0;">--------------------------------</div>
          
          <div style="font-weight: 900; font-size: 12px; margin-bottom: 5px;">STUDENT:</div>
          <div style="font-size: 16px; font-weight: 900; margin: 5px 0;">${selectedStudent.name}</div>
          <div style="font-weight: 700;">ID: ${selectedStudent.id}</div>
          
          <div style="font-size: 10px; margin: 15px 0;">--------------------------------</div>
          
          <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 13px;">
            <span>FEE FOR ${lastReceipt.month}</span>
            <span>LKR 1,000.00</span>
          </div>
          
          <div style="font-size: 10px; margin: 20px 0;">================================</div>
          
          <div style="display: flex; justify-content: space-between; font-size: 22px; font-weight: 900;">
            <span>TOTAL</span>
            <span>LKR 1,000</span>
          </div>
          <div style="font-size: 10px; margin: 30px 0 15px 0;">********************************</div>
        </div>

        <center>
          <img src="${qrUrl}" style="width: 35mm; height: 35mm; margin: 10px 0;" />
          <div style="font-size: 8px; font-weight: 900; margin-top: 25px;">EXCELLENCE ENGLISH - SRI LANKA</div>
        </center>
      </div>
    `;

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const node = document.getElementById('receipt-capture-target');
      if (node) {
        const dataUrl = await toPng(node, { pixelRatio: 2.5 });
        setPreviewImage(dataUrl);
      }
    } catch (err) {
      console.error('Receipt capture failed:', err);
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
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-white">Class Fee Desk</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2">Manage monthly class contributions</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="relative group flex-1 w-full max-w-xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
          <input 
            placeholder="Search by name or ID..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-16 pr-8 py-4 md:py-5 text-xl font-black tracking-tight focus:outline-none focus:border-blue-600 transition-all shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {searchTerm && filteredStudents.length > 0 && !selectedStudent && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-3xl z-50 overflow-hidden animate-in slide-in-from-top-2">
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
          onClick={startScanner}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 md:py-5 rounded-2xl flex items-center justify-center gap-4 font-black shadow-lg transition-all transform hover:scale-105 uppercase tracking-tighter text-base md:text-lg"
        >
          <ScanQrCode size={28} />
          Scan Student ID
        </button>
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 space-y-10 shadow-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-4 italic text-blue-500">
                <User size={28}/>
                Student Record
              </h3>
              <button onClick={() => { setSelectedStudent(null); setLastReceipt(null); }} className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-slate-700 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-blue-500">
                  <Hash size={36} />
                </div>
                <div>
                  <p className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none mb-1 text-white">{selectedStudent.name}</p>
                  <p className="text-blue-500 font-black uppercase text-xs tracking-[0.4em]">{selectedStudent.id} • {selectedStudent.grade}</p>
                </div>
              </div>

              <div className="p-8 bg-slate-950 rounded-3xl border border-slate-800">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-8">Pending Class Fees</p>
                {getUnpaidMonths(selectedStudent.lastPaymentMonth).map(month => (
                  <button 
                    key={month}
                    disabled={isProcessing}
                    onClick={() => handleProcessPayment(selectedStudent, month)}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-6 rounded-2xl flex items-center justify-between font-black tracking-tighter transition-all shadow-xl shadow-blue-600/10 group overflow-hidden"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-xl md:text-2xl uppercase leading-none">{month} Fee</span>
                      <span className="text-[9px] opacity-70 tracking-widest uppercase font-bold mt-1">Monthly Contribution</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-black tracking-tight">LKR 1,000</span>
                      <CreditCard size={28} className="group-hover:translate-x-1 transition-transform"/>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {lastReceipt ? (
              <div className="bg-white text-slate-950 p-10 rounded-[3rem] shadow-3xl space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <h4 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-emerald-600">Updated</h4>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Fee received for {lastReceipt.month}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 mt-8">
                  <button 
                    onClick={sendDigitalUpdate}
                    disabled={isSendingUpdate}
                    className="w-full bg-emerald-600 text-white py-5 rounded-2xl flex items-center justify-center gap-4 font-black hover:bg-emerald-500 transition-all shadow-xl uppercase text-base disabled:opacity-50"
                  >
                    {isSendingUpdate ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    Send Parent Update
                  </button>
                  <button 
                    onClick={generateReceipt}
                    disabled={isGenerating}
                    className="w-full bg-slate-950 text-white py-5 rounded-2xl flex items-center justify-center gap-4 font-black hover:bg-slate-800 transition-all shadow-3xl uppercase text-base disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
                    Display Receipt
                  </button>
                  <button onClick={undoLastPayment} className="w-full text-rose-600 py-2 font-black uppercase text-[10px] tracking-widest hover:text-rose-700">
                    Reverse Update
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900/10 border-4 border-dashed border-slate-800/50 rounded-[4rem] flex flex-col items-center justify-center text-slate-800 p-16 text-center">
                <div className="w-24 h-24 bg-slate-900/40 rounded-full flex items-center justify-center mb-10 border border-slate-800/50">
                  <Printer size={48} className="opacity-20" />
                </div>
                <h4 className="text-2xl font-black uppercase tracking-tighter italic opacity-60">Desk Ready</h4>
                <p className="font-bold uppercase text-[10px] tracking-[0.5em] opacity-30 mt-3">Search student to update fees</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-xl p-8 rounded-[4rem] border border-slate-800 shadow-3xl overflow-hidden relative">
            <button onClick={stopScanner} className="absolute top-6 right-6 z-10 w-12 h-12 bg-slate-950 rounded-full flex items-center justify-center text-slate-700 hover:text-white border border-slate-800">
              <X size={28} />
            </button>
            <div className="text-center mb-10">
              <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-white">Identity Gate</h3>
              <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[10px] mt-2">Scan Student ID Pass</p>
            </div>
            
            <div className="relative rounded-[3rem] overflow-hidden border-8 border-slate-800 bg-black">
              <video ref={videoRef} className="w-full h-[400px] object-cover scale-x-[-1]" playsInline />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-blue-600/60 rounded-[3rem] animate-pulse"></div>
              </div>
            </div>
            
            <button onClick={stopScanner} className="w-full mt-10 bg-slate-800 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-slate-700 transition-all">
              CLOSE SCANNER
            </button>
          </div>
        </div>
      )}

      {/* Receipt Pop-up Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 max-w-lg w-full shadow-3xl relative overflow-hidden animate-in zoom-in-95 duration-500">
            <button onClick={() => setPreviewImage(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all z-20">
              <X size={32} />
            </button>
            
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-white">Class Receipt</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Physical verification copy</p>
            </div>

            <div className="flex justify-center mb-10 bg-white p-4 rounded-3xl overflow-hidden">
              <img src={previewImage} className="w-full max-w-[280px] rounded" alt="Receipt Preview" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={handlePrint} className="bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-blue-500 uppercase tracking-widest text-xs">
                <Printer size={20} />
                Print
              </button>
              <a href={previewImage} download="ClassFee_Receipt.png" className="bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-700 transition-all uppercase tracking-widest text-xs text-center">
                <Download size={20} />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDesk;
