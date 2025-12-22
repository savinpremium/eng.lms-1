
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Student, Page } from '../types';
import { UserPlus, Search, Trash2, User, Printer, X, Loader2 } from 'lucide-react';
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
    if (confirm(`Remove student "${name}"?`)) {
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
      <div id="pvc-card-target" style="width: 324px; height: 204px; background: white; border-radius: 12px; position: relative; overflow: hidden; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        <!-- Top Bar -->
        <div style="background: #020617; padding: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-size: 14px; font-weight: 900; color: white; text-transform: uppercase; letter-spacing: 2px;">EXCELLENCE ENGLISH</div>
          <div style="font-size: 6px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 3px; margin-top: 2px;">INSTITUTIONAL PASSPORT</div>
        </div>

        <!-- Main Content -->
        <div style="flex: 1; display: flex; padding: 16px; gap: 16px;">
          <!-- QR Section -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
            <div style="padding: 4px; border: 1px solid #f1f5f9; background: white;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${student.id}" style="width: 80px; height: 80px;" />
            </div>
            <div style="font-size: 8px; font-weight: 900; color: #020617; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px;">${student.id}</div>
          </div>

          <!-- Student Info Section -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 6px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">STUDENT NAME</div>
            <div style="font-size: 16px; font-weight: 900; color: #020617; text-transform: uppercase; line-height: 1.1; margin-bottom: 8px;">${student.name}</div>
            
            <div style="display: flex; gap: 16px;">
              <div>
                <div style="font-size: 6px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">LEVEL</div>
                <div style="font-size: 10px; font-weight: 900; color: #2563eb;">${student.grade}</div>
              </div>
              <div>
                <div style="font-size: 6px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">JOINED</div>
                <div style="font-size: 10px; font-weight: 900; color: #020617;">2025</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Accent -->
        <div style="height: 6px; background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);"></div>
      </div>
    `;

    try {
      await new Promise(r => setTimeout(r, 600));
      const node = document.getElementById('pvc-card-target');
      if (node) {
        const dataUrl = await toPng(node, { pixelRatio: 4 });
        setPvcImage(dataUrl);
      }
    } finally {
      setIsGenerating(false);
      buffer.innerHTML = '';
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none text-white">Student List</h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.4em] mt-3">Institutional Personnel Database</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              placeholder="SEARCH PERSONNEL..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-6 py-3 font-black focus:outline-none focus:border-blue-600 transition-all text-xs uppercase tracking-tight shadow-xl text-white shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => onNavigate(Page.ENROLLMENT)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 shadow-xl shadow-blue-600/20">
            <UserPlus size={18} />
            Register
          </button>
        </div>
      </header>

      <div className="bg-slate-900/30 rounded-[2.5rem] md:rounded-[3rem] border border-slate-800 overflow-hidden shadow-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500">Personnel</th>
                <th className="p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500">Level</th>
                <th className="p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500">Finance</th>
                <th className="p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-slate-900/50 transition-all group">
                  <td className="p-8">
                    <p className="font-black text-xl md:text-2xl tracking-tighter uppercase mb-0.5 text-white">{student.name}</p>
                    <span className="text-blue-500 font-black uppercase text-[9px] tracking-widest">{student.id}</span>
                  </td>
                  <td className="p-8">
                    <span className="bg-slate-800 px-4 py-2 rounded-xl font-black text-[10px] text-slate-300 shadow-inner border border-slate-700 uppercase">{student.grade}</span>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      Active
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-1">{student.lastPaymentMonth}</p>
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex gap-3 justify-end opacity-40 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleGeneratePVC(student)} className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white flex items-center justify-center shadow-xl border border-slate-800">
                        <Printer size={18} />
                      </button>
                      <button onClick={() => handleDelete(student.id, student.name)} className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white flex items-center justify-center shadow-xl border border-slate-800">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pvcImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 max-w-lg w-full shadow-3xl relative animate-in zoom-in duration-500">
             <button onClick={() => { setPvcImage(null); setSelectedForPrint(null); }} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={32}/></button>
             <div className="bg-slate-950 p-6 rounded-3xl mb-8 flex items-center justify-center shadow-inner">
               <img src={pvcImage} className="w-full h-auto rounded-lg shadow-2xl" alt="PVC ID" />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => window.print()} className="bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl border-b-4 border-blue-800">Print Pass</button>
               <a href={pvcImage} download={`ID_${selectedForPrint?.id}.png`} className="bg-slate-800 text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center border border-slate-700">Download</a>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistry;
