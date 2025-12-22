
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Student, Page } from '../types';
// Added Loader2 to the lucide-react imports
import { UserPlus, Search, Hash, Trash2, User, Printer, X, ShieldCheck, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';

const StudentRegistry: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState<Student | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pvcImage, setPvcImage] = useState<string | null>(null);

  useEffect(() => {
    return storageService.listenStudents(setStudents);
  }, []);

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete student "${name}"? This cannot be undone.`)) {
      await storageService.deleteStudent(id);
      audioService.playError();
    }
  };

  const handleGeneratePVC = async (student: Student) => {
    setSelectedForPrint(student);
    setIsGenerating(true);
    const buffer = document.getElementById('render-buffer');
    if (!buffer) return;

    buffer.innerHTML = `
      <div id="pvc-card-target" style="width: 324px; height: 204px; background: #020617; color: white; border-radius: 12px; position: relative; overflow: hidden; padding: 15px; font-family: 'Inter', sans-serif;">
        <div style="display: flex; gap: 12px; height: 100%;">
          <div style="flex: 0 0 80px; display: flex; flex-direction: column; gap: 10px;">
            <div style="width: 80px; height: 80px; background: #1e293b; border-radius: 8px; display: flex; items-center; justify-center;">
               <span style="font-size: 10px; font-weight: 900; color: #334155;">PHOTO</span>
            </div>
            <div style="width: 80px; height: 80px; background: white; border-radius: 8px; padding: 4px;">
               <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.id}" style="width: 100%; height: 100%;" />
            </div>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 12px; font-weight: 900; color: #3b82f6; text-transform: uppercase; letter-spacing: 2px;">Excellence English</div>
              <div style="font-size: 14px; font-weight: 900; margin-top: 8px; text-transform: uppercase; line-height: 1.2;">${student.name}</div>
              <div style="font-size: 8px; font-weight: 900; color: #475569; margin-top: 4px; text-transform: uppercase;">Institutional Personnel</div>
            </div>
            <div style="background: #1e293b; padding: 8px; border-radius: 6px;">
              <div style="font-size: 7px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 1px;">Access Identity</div>
              <div style="font-size: 16px; font-weight: 900; color: white; letter-spacing: -0.5px;">${student.id}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: 6px; font-weight: 900; color: #475569; text-transform: uppercase;">Level</div>
                <div style="font-size: 10px; font-weight: 900;">${student.grade}</div>
              </div>
              <div style="font-size: 10px; font-weight: 900; color: #3b82f6; opacity: 0.5;">2025</div>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      await new Promise(r => setTimeout(r, 500));
      const node = document.getElementById('pvc-card-target');
      if (node) {
        const dataUrl = await toPng(node, { pixelRatio: 3 });
        setPvcImage(dataUrl);
      }
    } finally {
      setIsGenerating(false);
      buffer.innerHTML = '';
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500 text-white">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">Registry</h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.4em] mt-3">Authorized Institutional Personnel Database</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              placeholder="SEARCH BY ID OR NAME..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-6 py-3 font-black focus:outline-none focus:border-blue-600 transition-all text-xs uppercase tracking-tight shadow-xl shadow-blue-900/5 text-white"
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
                    <p className="font-black text-xl md:text-2xl tracking-tighter uppercase mb-0.5 text-white">{student.name}</p>
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
                        Settled
                      </div>
                      <p className="text-xs font-bold text-slate-400 pl-3">{student.lastPaymentMonth}</p>
                    </div>
                  </td>
                  <td className="p-6 md:p-8 text-right">
                    <div className="flex gap-3 justify-end opacity-40 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleGeneratePVC(student)}
                        className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-xl"
                        title="Generate Physical ID"
                      >
                        <Printer size={18} />
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
              <User size={40} className="text-slate-800" />
            </div>
            <p className="text-slate-600 font-bold italic text-base md:text-lg uppercase tracking-tighter">No Personnel Records Found</p>
            <button onClick={() => onNavigate(Page.ENROLLMENT)} className="mt-4 text-blue-500 font-black uppercase text-[10px] tracking-[0.4em] underline hover:text-blue-400 transition-all">Create Enrollment Entry</button>
          </div>
        )}
      </div>

      {/* PVC Print Preview */}
      {pvcImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 max-w-lg w-full shadow-3xl relative animate-in zoom-in duration-500">
             <button onClick={() => { setPvcImage(null); setSelectedForPrint(null); }} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={32}/></button>
             <div className="text-center mb-8">
               <h3 className="text-2xl font-black uppercase italic text-white">Institutional Pass</h3>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">PVC Card Layout Ready</p>
             </div>
             
             <div className="bg-slate-950 p-6 rounded-3xl mb-8 flex items-center justify-center border border-slate-800 shadow-inner">
               <img src={pvcImage} className="w-full h-auto rounded-lg shadow-2xl" alt="PVC ID" />
             </div>

             <div className="flex gap-4">
               <button 
                 onClick={() => {
                   const win = window.open('');
                   if (win) {
                     win.document.write(`<img src="${pvcImage}" style="width: 324px; height: 204px;" />`);
                     win.document.close();
                     win.focus();
                     win.print();
                     win.close();
                   }
                 }}
                 className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20"
               >
                 Print Card
               </button>
               <a 
                 href={pvcImage} 
                 download={`ID_${selectedForPrint?.id}.png`}
                 className="flex-1 bg-slate-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center"
               >
                 Save PNG
               </a>
             </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <div className="text-center">
            <Loader2 className="animate-spin text-blue-500 mx-auto mb-6" size={64} />
            <p className="text-xl font-black uppercase italic tracking-tighter">Assembling Identity Artifact...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistry;
