
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { generateWhatsAppDraft } from '../services/geminiService';
import { Student, PaymentRecord } from '../types';
import { toPng } from 'html-to-image';
import { Search, Printer, CreditCard, ChevronRight, User, Hash, X, CheckCircle, Loader2, Sparkles, Zap, ScanQrCode, Camera, Image as ImageIcon, ShieldAlert, Info } from 'lucide-react';

const PaymentDesk: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [lastReceipt, setLastReceipt] = useState<PaymentRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingUpdate, setIsSendingUpdate] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isDecodingFile, setIsDecodingFile] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isSecure, setIsSecure] = useState(true);

  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const secure = window.isSecureContext || window.location.hostname === 'localhost';
    setIsSecure(!!secure && hasMedia);

    return storageService.listenStudents(setStudents);
  }, []);

  useEffect(() => {
    let active = true;
    if (isScannerActive && isScannerModalOpen) {
      const initScanner = async () => {
        await new Promise(r => setTimeout(r, 300)); // Longer wait for modal
        if (!active) return;

        try {
          const Html5Qrcode = (window as any).Html5Qrcode;
          if (!Html5Qrcode) return;

          const element = document.getElementById("qr-reader-payment");
          if (!element) {
            setScannerError("Mount point missing.");
            return;
          }

          scannerRef.current = new Html5Qrcode("qr-reader-payment");
          await scannerRef.current.start(
            { facingMode: "environment" },
            { 
              fps: 20, 
              qrbox: (w: number, h: number) => {
                const min = Math.min(w, h);
                const s = Math.floor(min * 0.7);
                return { width: s, height: s };
              },
              aspectRatio: undefined 
            },
            (decodedText: string) => {
              const student = students.find(s => s.id.toUpperCase() === decodedText.trim().toUpperCase());
              if (student) {
                setSelectedStudent(student);
                audioService.playSuccess();
                closeScanner();
              }
            }
          );
        } catch (e: any) {
          console.error("Scanner Error:", e);
          if (active) {
            setScannerError(e.name === 'NotAllowedError' ? "Permission denied." : "Hardware restricted.");
            setIsScannerActive(false);
          }
        }
      };
      initScanner();
    }

    return () => {
      active = false;
      if (scannerRef.current) {
        try { if (scannerRef.current.isScanning) scannerRef.current.stop(); } catch (e) {}
      }
    };
  }, [isScannerActive, isScannerModalOpen, students]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return [];
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, students]);

  const openScanner = () => {
    setScannerError(null);
    setIsScannerModalOpen(true);
    setIsScannerActive(false);
  };

  const startScanner = async () => {
    setScannerError(null);
    if (!isSecure && window.location.hostname !== 'localhost') {
      setScannerError("Secure context (HTTPS) required for live video.");
      return;
    }
    setIsScannerActive(true);
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingFile(true);
    try {
      const Html5Qrcode = (window as any).Html5Qrcode;
      const html5QrCode = new Html5Qrcode("render-buffer", false);
      const decodedText = await html5QrCode.scanFile(file, true);
      const student = students.find(s => s.id.toUpperCase() === decodedText.trim().toUpperCase());
      if (student) {
        setSelectedStudent(student);
        audioService.playSuccess();
        closeScanner();
      } else {
        alert("ID decoded (" + decodedText + ") but no record found.");
      }
    } catch (err) {
      console.error("File Scan Error:", err);
      alert("No QR detected. Please ensure the code is clear and retry.");
    } finally {
      setIsDecodingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const closeScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
    }
    setIsScannerActive(false);
    setIsScannerModalOpen(false);
    scannerRef.current = null;
  };

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
      console.error("Ledger sync failed", e);
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
    } finally {
      setIsSendingUpdate(false);
    }
  };

  const undoLastPayment = async () => {
    if (!lastReceipt || !selectedStudent) return;
    if (!confirm("Reverse this ledger entry?")) return;

    await storageService.deletePayment(lastReceipt.id);
    const [year, month] = lastReceipt.month.split('-').map(Number);
    const prevMonthNum = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthStr = `${prevYear}-${prevMonthNum.toString().padStart(2, '0')}`;
    
    const rolledBackStudent = { ...selectedStudent, lastPaymentMonth: prevMonthStr };
    await storageService.updateStudent(rolledBackStudent);
    
    setSelectedStudent(rolledBackStudent);
    setLastReceipt(null);
  };

  const generateReceipt = async () => {
    if (!lastReceipt || !selectedStudent) return;
    setIsGenerating(true);
    const buffer = document.getElementById('render-buffer');
    if (!buffer) return;

    buffer.innerHTML = `
      <div id="receipt-capture-target" style="width: 80mm; padding: 25px; font-family: 'JetBrains Mono', monospace; color: black; background: white; text-transform: uppercase; border: 1px dashed #ccc;">
        <center>
          <div style="font-size: 20px; font-weight: 900; margin-bottom: 5px;">EXCELLENCE ENGLISH</div>
          <div style="font-size: 10px; border: 1.5px solid black; padding: 3px 12px; display: inline-block;">FEE RECEIPT</div>
          <div style="font-size: 10px; margin-top: 15px;">================================</div>
        </center>
        <div style="font-size: 11px; margin-top: 15px;">
          <div>DATE: ${new Date(lastReceipt.timestamp).toLocaleDateString()}</div>
          <div>ENTRY: ${lastReceipt.id}</div>
          <div style="margin: 15px 0;">--------------------------------</div>
          <div style="font-weight: 900;">STUDENT: ${selectedStudent.name}</div>
          <div>ID: ${selectedStudent.id}</div>
          <div style="margin: 15px 0;">--------------------------------</div>
          <div style="display: flex; justify-content: space-between; font-weight: 900;">
            <span>FEE FOR ${lastReceipt.month}</span>
            <span>LKR 1,000</span>
          </div>
          <div style="font-size: 22px; font-weight: 900; margin-top: 20px;">TOTAL: LKR 1,000</div>
        </div>
      </div>
    `;

    try {
      await new Promise(r => setTimeout(r, 600));
      const node = document.getElementById('receipt-capture-target');
      if (node) setPreviewImage(await toPng(node, { pixelRatio: 2.5 }));
    } finally {
      setIsGenerating(false);
      buffer.innerHTML = '';
    }
  };

  const getUnpaidMonths = (lastPaid: string) => {
    const [year, month] = lastPaid.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return [`${nextYear}-${nextMonth.toString().padStart(2, '0')}`];
  };

  return (
    <div className="space-y-6 md:space-y-12 pb-20">
      <header className="flex justify-between items-center animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-white">Payment Desk</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 flex items-center gap-2">
            <Zap size={12} className="text-blue-500 fill-blue-500" />
            Accounting Terminal
          </p>
        </div>
        <button onClick={openScanner} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl flex items-center gap-3 font-black shadow-xl transition-all uppercase text-xs tracking-widest border-b-4 border-blue-800">
          <ScanQrCode size={18} />
          Scan Identity
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="relative group flex-1 w-full max-w-xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
          <input 
            placeholder="Manual student search..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-16 pr-8 py-5 text-xl font-black focus:outline-none focus:border-blue-600 transition-all text-white shadow-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {searchTerm && filteredStudents.length > 0 && !selectedStudent && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-3xl z-50 overflow-hidden border-t-4 border-blue-600">
              {filteredStudents.map(s => (
                <button key={s.id} onClick={() => { setSelectedStudent(s); setSearchTerm(''); }} className="w-full flex items-center justify-between p-4 hover:bg-slate-800 rounded-xl transition-all text-white">
                  <div className="text-left">
                    <p className="font-black text-lg uppercase leading-none">{s.name}</p>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">{s.id}</p>
                  </div>
                  <ChevronRight className="text-slate-700" size={20}/>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 space-y-10 shadow-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-4 italic text-blue-500">
                <User size={28}/>
                Identity File
              </h3>
              <button onClick={() => { setSelectedStudent(null); setLastReceipt(null); }} className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-slate-700 hover:text-white transition-all border border-slate-800 shadow-xl">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-blue-500 shadow-inner">
                  <Hash size={36} />
                </div>
                <div>
                  <p className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none mb-1 text-white">{selectedStudent.name}</p>
                  <p className="text-blue-500 font-black uppercase text-xs tracking-[0.4em]">{selectedStudent.id} • {selectedStudent.grade}</p>
                </div>
              </div>

              <div className="p-8 bg-slate-950 rounded-3xl border border-slate-800 shadow-inner">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-8">Financial Requirements</p>
                {getUnpaidMonths(selectedStudent.lastPaymentMonth).map(month => (
                  <button key={month} disabled={isProcessing} onClick={() => handleProcessPayment(selectedStudent, month)} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-6 rounded-2xl flex items-center justify-between font-black tracking-tighter transition-all shadow-xl border-b-4 border-blue-800">
                    <div className="flex flex-col items-start">
                      <span className="text-xl md:text-2xl uppercase leading-none">{month} Settlement</span>
                      <span className="text-[9px] opacity-70 uppercase font-bold mt-1 tracking-widest">Authorized Transaction</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-black tracking-tight">LKR 1,000</span>
                      <CreditCard size={28} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {lastReceipt ? (
              <div className="bg-white text-slate-950 p-10 rounded-[3rem] shadow-3xl space-y-8 animate-in zoom-in duration-500 border-t-[12px] border-emerald-500">
                <div className="flex items-center gap-4 mb-10 text-emerald-600">
                  <CheckCircle size={32} />
                  <h4 className="text-3xl font-black uppercase italic leading-none">Entry Logged</h4>
                </div>
                <div className="flex flex-col gap-4 mt-8">
                  <button onClick={sendDigitalUpdate} disabled={isSendingUpdate} className="w-full bg-emerald-600 text-white py-5 rounded-2xl flex items-center justify-center gap-4 font-black uppercase text-base shadow-xl border-b-4 border-emerald-800">
                    {isSendingUpdate ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    Dispatch WhatsApp
                  </button>
                  <button onClick={generateReceipt} disabled={isGenerating} className="w-full bg-slate-950 text-white py-5 rounded-2xl flex items-center justify-center gap-4 font-black uppercase text-base shadow-xl border-b-4 border-slate-800">
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Printer />}
                    Receipt Voucher
                  </button>
                  <button onClick={undoLastPayment} className="w-full text-rose-600 py-2 font-black uppercase text-[10px] tracking-widest">Void Transaction</button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900/10 border-4 border-dashed border-slate-800/50 rounded-[4rem] flex flex-col items-center justify-center text-slate-800 p-16 text-center">
                <Printer size={48} className="opacity-10 mb-10" />
                <h4 className="text-2xl font-black uppercase tracking-tighter italic opacity-40 leading-tight">Session Ready <br /> for Settlement</h4>
              </div>
            )}
          </div>
        </div>
      )}

      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 w-full max-w-xl relative shadow-3xl animate-in zoom-in duration-300">
            <button onClick={closeScanner} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all"><X size={32}/></button>
            <h3 className="text-2xl font-black uppercase italic mb-8 text-white">Identity Capture</h3>
            
            <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-video border-4 border-slate-800 min-h-[300px] flex items-center justify-center shadow-inner">
              {!isScannerActive ? (
                <div className="text-center p-8 space-y-6">
                   <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 text-left">
                      <Info size={24} className="text-blue-500" />
                      <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-relaxed">Secure context check: {isSecure ? 'VERIFIED' : 'RESTRICTED'}.</p>
                   </div>
                   
                   <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                     {isSecure && (
                       <button 
                        onClick={startScanner}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 border-b-4 border-blue-800"
                       >
                        <ScanQrCode size={18} />
                        Open Stream
                       </button>
                     )}
                     
                     <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          ref={fileInputRef}
                          onChange={handleFileScan}
                          className="hidden" 
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isDecodingFile}
                          className={`w-full ${!isSecure ? 'bg-blue-600 border-blue-800 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'} px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 border-b-4 shadow-xl`}
                        >
                          {isDecodingFile ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                          {isDecodingFile ? 'Analyzing...' : (!isSecure ? 'Capture Photo' : 'Use Fallback')}
                        </button>
                      </div>
                   </div>

                   {scannerError && (
                      <p className="text-rose-500 font-black uppercase text-[8px] tracking-[0.2em]">{scannerError}</p>
                   )}
                </div>
              ) : (
                <div id="qr-reader-payment" className="w-full h-full"></div>
              )}
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mt-6 text-center">Center QR within viewfinder</p>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 max-w-lg w-full shadow-3xl relative overflow-hidden animate-in zoom-in-95 duration-500">
            <button onClick={() => setPreviewImage(null)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-all z-20"><X size={32} /></button>
            <div className="flex justify-center mb-10 bg-white p-6 rounded-[2rem] overflow-hidden shadow-2xl border-2 border-slate-200"><img src={previewImage} className="w-full max-w-[280px]" alt="Official Receipt" /></div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => window.print()} className="bg-blue-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl uppercase text-xs border-b-4 border-blue-800">Print</button>
              <a href={previewImage} download="Excellence_Receipt.png" className="bg-slate-800 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 uppercase text-xs text-center border border-slate-700 shadow-xl">Export PNG</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDesk;
