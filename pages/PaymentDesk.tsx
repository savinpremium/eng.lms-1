
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { generateWhatsAppDraft } from '../services/geminiService';
import { Student, PaymentRecord } from '../types';
import { toPng } from 'html-to-image';
import { Search, Printer, CreditCard, ChevronRight, User, Hash, X, CheckCircle, Loader2, Sparkles, Zap, ScanQrCode, Camera, Info } from 'lucide-react';

interface PaymentDeskProps {
  institutionId: string;
  institutionName?: string;
}

const PaymentDesk: React.FC<PaymentDeskProps> = ({ institutionId, institutionName }) => {
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
    return storageService.listenStudents(institutionId, setStudents);
  }, [institutionId]);

  useEffect(() => {
    let active = true;
    if (isScannerActive && isScannerModalOpen) {
      const initScanner = async () => {
        await new Promise(r => setTimeout(r, 600));
        if (!active) return;
        try {
          const Html5Qrcode = (window as any).Html5Qrcode;
          const element = document.getElementById("qr-reader-payment");
          if (!element || !Html5Qrcode) return;
          scannerRef.current = new Html5Qrcode("qr-reader-payment");
          await scannerRef.current.start(
            { facingMode: "environment" },
            { fps: 25, qrbox: (w: number, h: number) => { const s = Math.min(w, h) * 0.7; return { width: s, height: s }; }, aspectRatio: 1.0 },
            (decodedText: string) => {
              const student = students.find(s => s.id.toUpperCase() === decodedText.trim().toUpperCase());
              if (student) { setSelectedStudent(student); audioService.playSuccess(); closeScanner(); }
            }
          );
        } catch (e: any) {
          console.error(e);
          if (active) { setScannerError("Hardware restricted."); setIsScannerActive(false); }
        }
      };
      initScanner();
    }
    return () => { active = false; if (scannerRef.current) { try { if (scannerRef.current.isScanning) scannerRef.current.stop(); } catch (e) {} } };
  }, [isScannerActive, isScannerModalOpen, students]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return [];
    return students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, students]);

  const startScanner = async () => {
    if (!isSecure && window.location.hostname !== 'localhost') { setScannerError("HTTPS required."); return; }
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
      if (student) { setSelectedStudent(student); audioService.playSuccess(); closeScanner(); }
    } catch (err) { alert("Scan Failed."); } finally { setIsDecodingFile(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const closeScanner = async () => {
    if (scannerRef.current) { try { if (scannerRef.current.isScanning) await scannerRef.current.stop(); scannerRef.current.clear(); } catch (e) {} }
    setIsScannerActive(false); setIsScannerModalOpen(false); scannerRef.current = null;
  };

  const handleProcessPayment = async (student: Student, month: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const payment: PaymentRecord = { id: '', institutionId, studentId: student.id, amount: 1000, month, method: 'Cash', timestamp: Date.now() };
    try {
      const id = await storageService.addPayment(institutionId, payment);
      const updatedStudent = { ...student, lastPaymentMonth: month };
      await storageService.updateStudent(institutionId, updatedStudent);
      setSelectedStudent(updatedStudent); setLastReceipt({ ...payment, id }); audioService.playCash();
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const sendDigitalUpdate = async () => {
    if (!selectedStudent || !lastReceipt) return;
    setIsSendingUpdate(true);
    try {
      const draft = await generateWhatsAppDraft(selectedStudent, 'payment_received', undefined, undefined, institutionName);
      const phone = selectedStudent.contact.replace(/\D/g, '');
      const waPhone = phone.startsWith('0') ? '94' + phone.substring(1) : phone;
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(draft)}`, '_blank');
    } finally { setIsSendingUpdate(false); }
  };

  const generateReceipt = async () => {
    if (!lastReceipt || !selectedStudent) return;
    setIsGenerating(true);
    const buffer = document.getElementById('render-buffer');
    if (!buffer) return;
    const instTitle = (institutionName || 'Smart Campus').toUpperCase();
    buffer.innerHTML = `<div id="receipt-capture-target" style="width: 80mm; padding: 25px; font-family: 'JetBrains Mono', monospace; color: black; background: white; text-transform: uppercase; border: 1px dashed #ccc;"><center><div style="font-size: 16px; font-weight: 900; margin-bottom: 5px;">${instTitle}</div><div style="font-size: 10px; border: 1.5px solid black; padding: 3px 12px; display: inline-block;">FEE RECEIPT</div><div style="font-size: 10px; margin-top: 15px;">================================</div></center><div style="font-size: 11px; margin-top: 15px;"><div>DATE: ${new Date(lastReceipt.timestamp).toLocaleDateString()}</div><div>ENTRY: ${lastReceipt.id}</div><div style="margin: 15px 0;">--------------------------------</div><div style="font-weight: 900;">STUDENT: ${selectedStudent.name}</div><div>ID: ${selectedStudent.id}</div><div style="margin: 15px 0;">--------------------------------</div><div style="display: flex; justify-content: space-between; font-weight: 900;"><span>FEE FOR ${lastReceipt.month}</span><span>LKR 1,000</span></div><div style="font-size: 22px; font-weight: 900; margin-top: 20px;">TOTAL: LKR 1,000</div><div style="font-size: 8px; margin-top: 30px; text-align: center; opacity: 0.5;">Powered by SmartClass.lk Systems</div></div></div>`;
    try { await new Promise(r => setTimeout(r, 600)); const node = document.getElementById('receipt-capture-target'); if (node) setPreviewImage(await toPng(node, { pixelRatio: 2.5 })); } finally { setIsGenerating(false); buffer.innerHTML = ''; }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-center animate-in fade-in duration-500 p-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-white">Payments</h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.4em] mt-1 flex items-center gap-2">
            <Zap size={10} className="text-blue-500 fill-blue-500" />
            Institutional Ledger Terminal
          </p>
        </div>
        <button onClick={() => { setScannerError(null); setIsScannerModalOpen(true); setIsScannerActive(false); }} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3.5 rounded-2xl flex items-center gap-3 font-black shadow-xl transition-all uppercase text-[10px] tracking-widest border-b-4 border-blue-800 active:translate-y-1 active:border-b-0">
          <ScanQrCode size={16} />
          Identity Scan
        </button>
      </header>

      <div className="px-4">
        <div className="relative group flex-1 w-full max-w-xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input placeholder="Search Personnel By Name or ID..." className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-16 pr-8 py-5 text-lg font-black focus:outline-none focus:border-blue-600 transition-all text-white shadow-2xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && filteredStudents.length > 0 && !selectedStudent && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-3xl z-50 overflow-hidden border-t-4 border-blue-600 animate-in slide-in-from-top-4">
              {filteredStudents.map(s => (
                <button key={s.id} onClick={() => { setSelectedStudent(s); setSearchTerm(''); }} className="w-full flex items-center justify-between p-4 hover:bg-slate-800 rounded-xl transition-all text-white text-left">
                  <div>
                    <p className="font-black text-sm uppercase leading-none">{s.name}</p>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">{s.id}</p>
                  </div>
                  <ChevronRight size={16}/>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 animate-in fade-in duration-500">
          <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 space-y-8 shadow-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3 italic text-blue-500">
                <User size={24}/> Identity File
              </h3>
              <button onClick={() => { setSelectedStudent(null); setLastReceipt(null); }} className="p-3 bg-slate-950 rounded-xl text-slate-600 border border-slate-800 shadow-xl">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-blue-500 shadow-inner"><Hash size={28} /></div>
                <div>
                  <p className="text-2xl font-black tracking-tighter uppercase leading-none mb-1 text-white">{selectedStudent.name}</p>
                  <p className="text-blue-500 font-black uppercase text-[10px] tracking-[0.4em]">{selectedStudent.id} • {selectedStudent.grade}</p>
                </div>
              </div>
              <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 shadow-inner">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6">Financial Ledger</p>
                {[`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`].map(month => (
                  <button key={month} disabled={isProcessing} onClick={() => handleProcessPayment(selectedStudent, month)} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-5 rounded-2xl flex items-center justify-between font-black tracking-tighter shadow-xl border-b-4 border-blue-800 active:translate-y-1 active:border-b-0">
                    <span className="text-lg uppercase leading-none">{month} Settlement</span>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black">LKR 1,000</span>
                      <CreditCard size={20} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {lastReceipt ? (
              <div className="bg-white text-slate-950 p-10 rounded-[3rem] shadow-3xl space-y-6 animate-in zoom-in duration-500 border-t-[10px] border-emerald-500">
                <div className="flex items-center gap-4 text-emerald-600">
                  <CheckCircle size={28} />
                  <h4 className="text-2xl font-black uppercase italic leading-none">Entry Logged</h4>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <button onClick={sendDigitalUpdate} disabled={isSendingUpdate} className="w-full bg-emerald-600 text-white py-5 rounded-2xl flex items-center justify-center gap-4 font-black uppercase text-xs shadow-xl border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0">
                    {isSendingUpdate ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    Dispatch WhatsApp
                  </button>
                  <button onClick={generateReceipt} disabled={isGenerating} className="w-full bg-slate-950 text-white py-5 rounded-2xl flex items-center justify-center gap-4 font-black uppercase text-xs shadow-xl border-b-4 border-slate-800 active:translate-y-1 active:border-b-0">
                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
                    Print Official Receipt
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900/10 border-4 border-dashed border-slate-800/50 rounded-[4rem] flex flex-col items-center justify-center text-slate-800 p-16 text-center opacity-40">
                <Printer size={40} className="mb-6" />
                <h4 className="text-xl font-black uppercase tracking-tighter italic">Ledger Ready</h4>
              </div>
            )}
          </div>
        </div>
      )}

      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-6 w-full max-w-lg relative shadow-3xl">
            <button onClick={closeScanner} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={28}/></button>
            <h3 className="text-xl font-black uppercase italic mb-6 text-white p-2">Personnel Identity Scan</h3>
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-square border-4 border-slate-800 flex items-center justify-center shadow-inner">
              {!isScannerActive ? (
                <div className="text-center p-6 space-y-8">
                   <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 text-left">
                      <Info size={20} className="text-blue-500" />
                      <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-relaxed">System Port Locked. SmartPass Required.</p>
                   </div>
                   <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                     {isSecure && (
                       <button onClick={startScanner} className="bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl border-b-4 border-blue-800 active:translate-y-1 active:border-b-0 transition-all">
                        Open Secure Scanner
                       </button>
                     )}
                     <div className="relative">
                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileScan} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isDecodingFile} className="w-full bg-slate-800 text-slate-300 p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest border-b-4 border-slate-700 active:translate-y-1 active:border-b-0">
                          {isDecodingFile ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                          Snap Photo
                        </button>
                      </div>
                   </div>
                   {scannerError && <p className="text-rose-500 font-black uppercase text-[8px] tracking-widest">{scannerError}</p>}
                </div>
              ) : (
                <div id="qr-reader-payment" className="w-full h-full"></div>
              )}
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 mt-6 text-center italic">Systems powered by SmartClass.lk</p>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-2xl">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 max-w-lg w-full shadow-3xl relative">
            <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white z-20"><X size={28} /></button>
            <div className="flex justify-center mb-8 bg-white p-4 rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200"><img src={previewImage} className="w-full max-w-[280px]" alt="Official Receipt" /></div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => window.print()} className="bg-blue-600 text-white font-black py-4 rounded-2xl uppercase text-[10px] border-b-4 border-blue-800 active:translate-y-1 active:border-b-0">Direct Print</button>
              <a href={previewImage} download="Receipt.png" className="bg-slate-800 text-white font-black py-4 rounded-2xl uppercase text-[10px] flex items-center justify-center border border-slate-700 transition-all">Save as Image</a>
            </div>
            <p className="text-center mt-6 text-[8px] font-black uppercase text-slate-600 tracking-widest italic">Official SmartClass.lk Document</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDesk;
