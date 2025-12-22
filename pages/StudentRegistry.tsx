
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Student, Page } from '../types';
import { toPng } from 'html-to-image';
import { UserPlus, Search, Printer, QrCode, Hash, Loader2, Trash2, X, Printer as PrinterIcon, Download } from 'lucide-react';

const StudentRegistry: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);

  useEffect(() => {
    return storageService.listenStudents(setStudents);
  }, []);

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintCard = async (student: Student) => {
    setPrintingId(student.id);
    setPreviewStudent(student);
    
    const buffer = document.getElementById('render-buffer');
    if (!buffer) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${student.id}`;

    buffer.innerHTML = `
      <div id="registry-id-capture" style="width: 85.6mm; height: 53.98mm; padding: 0; font-family: 'Inter', sans-serif; color: white; background: #020617; border-radius: 12px; overflow: hidden; display: flex; position: relative; box-sizing: border-box;">
        <div style="position: absolute; top: -15mm; right: -15mm; width: 45mm; height: 45mm; background: #2563eb; opacity: 0.2; border-radius: 50%;"></div>
        
        <div style="flex: 0 0 34mm; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 2px solid #1e293b; z-index: 10;">
          <img src="${qrUrl}" style="width: 26mm; height: 26mm; margin-bottom: 2mm;" />
          <div style="color: #020617; font-size: 7pt; font-weight: 900; letter-spacing: 1px; background: #f1f5f9; padding: 1mm 3mm; border-radius: 4px;">PASS KEY</div>
        </div>
        
        <div style="flex: 1; padding: 6mm 8mm; display: flex; flex-direction: column; justify-content: space-between; z-index: 10;">
          <div>
            <h1 style="font-size: 11pt; font-weight: 900; color: #3b82f6; margin: 0; text-transform: uppercase; line-height: 1;">Excellence English</h1>
            <p style="font-size: 5pt; letter-spacing: 2px; font-weight: 800; color: #64748b; margin: 0; text-transform: uppercase;">Student Identity</p>
          </div>
          
          <div style="margin: 1.5mm 0;">
            <p style="font-size: 4.5pt; font-weight: 900; color: #3b82f6; margin: 0; text-transform: uppercase;">Personnel</p>
            <h2 style="font-size: 13.5pt; font-weight: 900; margin: 0.5mm 0; color: #f8fafc; text-transform: uppercase; letter-spacing: -0.5px;">${student.name}</h2>
            <p style="font-size: 9.5pt; font-weight: 900; color: #3b82f6; margin: 0.5mm 0; font-family: monospace; letter-spacing: 1px;">${student.id}</p>
          </div>
          
          <div style="display: flex; gap: 6mm; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2.5mm;">
            <div>
              <p style="font-size: 4pt; font-weight: 900; color: #475569; margin: 0; text-transform: uppercase;">Grade</p>
              <p style="font-size: 8.5pt; font-weight: 900; margin: 0;">${student.grade}</p>
            </div>
            <div>
              <p style="font-size: 4pt; font-weight: 900; color: #475569; margin: 0; text-transform: uppercase;">Status</p>
              <p style="font-size: 8.5pt; font-weight: 900; margin: 0; color: #10b981;">VERIFIED</p>
            </div>
          </div>
        </div>
        
        <div style="position: absolute; bottom: 0; left: 34mm; right: 0; height: 1.5mm; background: #2563eb;"></div>
      </div>
    `;

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const node = document.getElementById('registry-id-capture');
      if (node) {
        const dataUrl = await toPng(node, { pixelRatio: 3, skipFonts: true, fontEmbedCSS: '' });
        setPreviewImage(dataUrl);
      }
    } catch (error) {
      console.error('Print capture failed:', error);
    } finally {
      buffer.innerHTML = '';
      setPrintingId(null);
    }
  };

  const handlePrintActual = () => {
    if (!previewImage) return;
    const printSection = document.getElementById('print-section');
    if (!printSection) return;
    printSection.innerHTML = `<img src="${previewImage}" style="width: 85.6mm; height: 53.98mm;" />`;
    window.print();
    printSection.innerHTML = '';
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete student "${name}"? This cannot be undone.`)) {
      await storageService.deleteStudent(id);
      audioService.playError();
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">Registry</h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.4em] mt-3">Authorized Institutional Personnel Database</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              placeholder="SEARCH IDENTITIES..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-6 py-3 font-black focus:outline-none focus:border-blue-600 transition-all text-xs uppercase tracking-tight shadow-xl shadow-blue-900/5"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => onNavigate(Page.ENROLLMENT)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 transition-all shadow-xl shadow-blue-600/20"
          >
            <UserPlus size={18} />
            Enroll
          </button>
        </div>
      </header>

      <div className="bg-slate-900/30 rounded-[2rem] md:rounded-[3.5rem] border border-slate-800 overflow-hidden shadow-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="p-6 md:p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500">Personnel Identity</th>
                <th className="p-6 md:p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500">Academic Level</th>
                <th className="p-6 md:p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500">Finance Status</th>
                <th className="p-6 md:p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500 text-right">System Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-slate-900/50 transition-all group">
                  <td className="p-6 md:p-8">
                    <p className="font-black text-xl md:text-2xl tracking-tighter uppercase mb-0.5">{student.name}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-blue-500 font-black uppercase text-[9px] tracking-widest">{student.id}</span>
                       <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                       <span className="text-slate-600 font-bold text-[8px] uppercase tracking-widest">Enrolled: {student.registrationDate}</span>
                    </div>
                  </td>
                  <td className="p-6 md:p-8">
                    <span className="bg-slate-800 px-4 py-2 rounded-xl font-black text-[10px] text-slate-300 shadow-inner border border-slate-700 uppercase">{student.grade}</span>
                  </td>
                  <td className="p-6 md:p-8">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        Settled Cycle
                      </div>
                      <p className="text-xs font-bold text-slate-400 pl-3">{student.lastPaymentMonth}</p>
                    </div>
                  </td>
                  <td className="p-6 md:p-8 text-right">
                    <div className="flex gap-3 justify-end opacity-40 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handlePrintCard(student)}
                        disabled={printingId === student.id}
                        className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 text-white rounded-xl hover:bg-blue-600 flex items-center justify-center transition-all shadow-xl hover:shadow-blue-600/20 disabled:opacity-50"
                        title="Print Physical ID"
                      >
                        {printingId === student.id ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id, student.name)}
                        className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shadow-xl"
                        title="Delete Student"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-20 md:p-32 text-center animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <QrCode size={40} className="text-slate-800" />
            </div>
            <p className="text-slate-600 font-bold italic text-base md:text-lg uppercase tracking-tighter">Database Entry Point Not Found</p>
            <button onClick={() => onNavigate(Page.ENROLLMENT)} className="mt-4 text-blue-500 font-black uppercase text-[10px] tracking-[0.4em] underline hover:text-blue-400 transition-all">Initialize Enrollment Sequence</button>
          </div>
        )}
      </div>

      {/* ID Card Pop-up Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full shadow-3xl relative overflow-hidden animate-in zoom-in-95 duration-500">
            <button onClick={() => { setPreviewImage(null); setPreviewStudent(null); }} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all">
              <X size={32} />
            </button>
            
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Institutional Pass</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Personnel Registry Record</p>
            </div>

            <div className="flex justify-center mb-12">
              <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-2xl">
                <img src={previewImage} className="w-full max-w-sm rounded-xl shadow-2xl" alt="ID Card Preview" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handlePrintActual}
                className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all uppercase tracking-widest text-xs"
              >
                <PrinterIcon size={20} />
                Print Image
              </button>
              <a 
                href={previewImage} 
                download={`${previewStudent?.id}_card.png`}
                className="flex-1 bg-slate-800 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-700 transition-all uppercase tracking-widest text-xs"
              >
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

export default StudentRegistry;
