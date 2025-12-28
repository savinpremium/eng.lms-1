
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Student, Page } from '../types';
import { Search, Trash2, Printer, X, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';

interface StudentRegistryProps {
  institutionId: string;
  institutionName?: string;
  onNavigate: (page: Page) => void;
}

const StudentRegistry: React.FC<StudentRegistryProps> = ({ institutionId, institutionName, onNavigate }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState<Student | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pvcImage, setPvcImage] = useState<string | null>(null);

  useEffect(() => {
    return storageService.listenStudents(institutionId, setStudents);
  }, [institutionId]);

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Terminate record for "${name}"?`)) {
      await storageService.deleteStudent(institutionId, id);
      audioService.playError();
    }
  };

  const handleGeneratePVC = async (student: Student) => {
    setSelectedForPrint(student);
    setIsGenerating(true);
    const buffer = document.getElementById('render-buffer');
    if (!buffer) return;

    const nameParts = student.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const instTitle = institutionName || 'SMART CAMPUS';

    buffer.innerHTML = `
      <div id="pvc-card-target" style="width: 648px; height: 408px; background: white; border-radius: 40px; position: relative; overflow: hidden; font-family: 'Inter', sans-serif; display: flex; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        <div style="flex: 0 0 38%; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; position: relative;">
          <div style="width: 220px; height: 220px; background: white; display: flex; align-items: center; justify-content: center;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${student.id}" style="width: 100%; height: 100%;" />
          </div>
          <div style="margin-top: 30px; background: #f1f5f9; padding: 12px 36px; border-radius: 12px; font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: 4px; text-transform: uppercase;">
            GATE PASS
          </div>
        </div>

        <div style="flex: 1; background: #020617; padding: 45px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -50px; right: -50px; width: 350px; height: 350px; background: #1e3a8a; border-radius: 50%; opacity: 0.2; filter: blur(60px);"></div>
          
          <div style="position: relative; z-index: 10;">
            <div style="font-size: 28px; font-weight: 900; color: #3b82f6; text-transform: uppercase; letter-spacing: -1px; line-height: 0.9;">
              ${instTitle}
            </div>
            <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 5px; margin-top: 10px;">
              SMARTCLASS.LK SYSTEM
            </div>
          </div>

          <div style="position: relative; z-index: 10; margin-top: 25px;">
            <div style="font-size: 10px; font-weight: 900; color: #3b82f6; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">PERSONNEL</div>
            <div style="font-size: 38px; font-weight: 900; color: white; text-transform: uppercase; line-height: 1; letter-spacing: -1px; margin-bottom: 5px;">
              ${firstName}<br/>${lastName}
            </div>
            <div style="font-size: 24px; font-weight: 900; color: #3b82f6; letter-spacing: 1px;">
              ${student.id}
            </div>
          </div>

          <div style="position: relative; z-index: 10;">
            <div style="height: 1px; background: #1e293b; width: 100%; margin-bottom: 25px;"></div>
            <div style="display: flex; gap: 50px;">
              <div>
                <div style="font-size: 10px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">GRADE</div>
                <div style="font-size: 22px; font-weight: 900; color: white;">${student.grade}</div>
              </div>
              <div>
                <div style="font-size: 10px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">STATUS</div>
                <div style="font-size: 22px; font-weight: 900; color: #10b981;">VERIFIED</div>
              </div>
            </div>
          </div>
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 14px; background: #2563eb;"></div>
        </div>
      </div>
    `;

    try {
      await new Promise(r => setTimeout(r, 800));
      const node = document.getElementById('pvc-card-target');
      if (node) {
        const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: 'transparent' });
        setPvcImage(dataUrl);
      }
    } finally {
      setIsGenerating(false);
      buffer.innerHTML = '';
    }
  };

  return (
    <div className="space-y-6 md:space-y-12 pb-20 p-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none text-white">Students</h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.4em] mt-2">Active Academic Registry | {institutionName}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              placeholder="SEARCH..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 font-black focus:outline-none focus:border-blue-600 transition-all text-xs uppercase text-white shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => onNavigate(Page.REGISTRATION)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase flex items-center gap-2 shadow-xl border-b-4 border-blue-800 active:translate-y-1 active:border-b-0 transition-all">
            Register Student
          </button>
        </div>
      </header>

      <div className="bg-slate-900/30 rounded-[2.5rem] md:rounded-[3rem] border border-slate-800 overflow-hidden shadow-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="p-6 md:p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500">Student</th>
                <th className="p-6 md:p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500 hidden md:table-cell">Level</th>
                <th className="p-6 md:p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500 hidden md:table-cell">Finance</th>
                <th className="p-6 md:p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-slate-900/50 transition-all group">
                  <td className="p-6 md:p-8">
                    <p className="font-black text-lg md:text-2xl tracking-tighter uppercase mb-0.5 text-white">{student.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500 font-black uppercase text-[9px] tracking-widest">{student.id}</span>
                      <span className="md:hidden text-slate-500 font-black uppercase text-[8px] tracking-widest bg-slate-800 px-2 py-0.5 rounded-lg">{student.grade}</span>
                    </div>
                  </td>
                  <td className="p-8 hidden md:table-cell">
                    <span className="bg-slate-800 px-4 py-2 rounded-xl font-black text-[10px] text-slate-300 shadow-inner border border-slate-700 uppercase">{student.grade}</span>
                  </td>
                  <td className="p-8 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Paid
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase">{student.lastPaymentMonth}</p>
                  </td>
                  <td className="p-6 md:p-8 text-right">
                    <div className="flex gap-2 md:gap-3 justify-end">
                      <button 
                        onClick={() => handleGeneratePVC(student)} 
                        disabled={isGenerating && selectedForPrint?.id === student.id}
                        className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white flex items-center justify-center shadow-xl border border-slate-800 disabled:opacity-50"
                      >
                        {isGenerating && selectedForPrint?.id === student.id ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-6 md:p-10 max-w-2xl w-full shadow-3xl relative animate-in zoom-in duration-500 overflow-hidden">
             <button onClick={() => { setPvcImage(null); setSelectedForPrint(null); }} className="absolute top-6 right-6 md:top-8 md:right-8 text-slate-500 hover:text-white z-20"><X size={32}/></button>
             <div className="bg-slate-950 p-4 md:p-6 rounded-3xl mb-8 flex items-center justify-center shadow-inner overflow-hidden min-h-[300px]">
               <div className="id-preview-container">
                 <img src={pvcImage} className="w-[648px] max-w-none h-auto rounded-lg shadow-2xl" alt="PVC ID" />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => window.print()} className="bg-blue-600 text-white py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl border-b-4 border-blue-800 transition-all hover:bg-blue-500 active:translate-y-1">Print Pass</button>
               <a href={pvcImage} download={`ID_${selectedForPrint?.id}.png`} className="bg-slate-800 text-white py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center border border-slate-700 hover:bg-slate-700 transition-all">Download</a>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistry;
