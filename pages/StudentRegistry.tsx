
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Student, Page } from '../types';
import { UserPlus, Search, Printer, QrCode, Hash } from 'lucide-react';

const StudentRegistry: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    return storageService.listenStudents(setStudents);
  }, []);

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintCard = (student: Student) => {
    const printEl = document.getElementById('print-section');
    if (!printEl) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${student.id}`;

    printEl.innerHTML = `
      <div style="width: 85.6mm; height: 53.98mm; padding: 0; font-family: 'Inter', sans-serif; color: white; background: #020617; border-radius: 3.18mm; overflow: hidden; display: flex; position: relative; box-sizing: border-box; -webkit-print-color-adjust: exact;">
        <div style="position: absolute; top: -15mm; right: -15mm; width: 45mm; height: 45mm; background: #2563eb; opacity: 0.2; border-radius: 50%;"></div>
        
        <div style="flex: 0 0 34mm; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 2px solid #1e293b; z-index: 10;">
          <img src="${qrUrl}" style="width: 26mm; height: 26mm; margin-bottom: 2mm;" />
          <div style="color: #020617; font-size: 6.5pt; font-weight: 900; letter-spacing: 1px; background: #f1f5f9; padding: 1mm 3mm; border-radius: 1mm;">GATE KEY</div>
        </div>
        
        <div style="flex: 1; padding: 5mm 7mm; display: flex; flex-direction: column; justify-content: space-between; z-index: 10;">
          <div>
            <h1 style="font-size: 11pt; font-weight: 900; color: #3b82f6; margin: 0; text-transform: uppercase; line-height: 1;">Excellence English</h1>
            <p style="font-size: 5pt; letter-spacing: 2px; font-weight: 800; color: #64748b; margin: 1mm 0 0 0; text-transform: uppercase;">Professional Network</p>
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
    window.print();
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Student Registry</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">Authorized Institutional Personnel Database</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              placeholder="SEARCH IDENTITIES..."
              className="w-full bg-slate-900 border border-slate-800 rounded-3xl pl-16 pr-6 py-4 font-black focus:outline-none focus:border-blue-600 transition-all text-sm uppercase tracking-tight shadow-xl shadow-blue-900/5"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => onNavigate(Page.ENROLLMENT)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-3xl font-black text-xs tracking-[0.2em] uppercase flex items-center gap-3 transition-all shadow-2xl shadow-blue-600/20"
          >
            <UserPlus size={20} />
            Enroll
          </button>
        </div>
      </header>

      <div className="bg-slate-900/30 rounded-[4.5rem] border border-slate-800 overflow-hidden shadow-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="p-10 text-[10px] font-black tracking-[0.4em] uppercase text-slate-500">Personnel Identity</th>
                <th className="p-10 text-[10px] font-black tracking-[0.4em] uppercase text-slate-500">Academic Level</th>
                <th className="p-10 text-[10px] font-black tracking-[0.4em] uppercase text-slate-500">Finance Status</th>
                <th className="p-10 text-[10px] font-black tracking-[0.4em] uppercase text-slate-500">System Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-slate-900/50 transition-all group">
                  <td className="p-10">
                    <p className="font-black text-2xl tracking-tighter uppercase mb-0.5">{student.name}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-blue-500 font-black uppercase text-[10px] tracking-widest">{student.id}</span>
                       <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                       <span className="text-slate-600 font-bold text-[9px] uppercase tracking-widest">Enrolled: ${student.registrationDate}</span>
                    </div>
                  </td>
                  <td className="p-10">
                    <span className="bg-slate-800 px-6 py-3 rounded-2xl font-black text-xs text-slate-300 shadow-inner border border-slate-700 uppercase">${student.grade}</span>
                  </td>
                  <td className="p-10">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        Settled Cycle
                      </div>
                      <p className="text-sm font-bold text-slate-400 pl-4">${student.lastPaymentMonth}</p>
                    </div>
                  </td>
                  <td className="p-10 text-right">
                    <div className="flex gap-4 justify-end opacity-20 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handlePrintCard(student)}
                        className="w-14 h-14 bg-slate-950 text-white rounded-2xl hover:bg-blue-600 flex items-center justify-center transition-all shadow-xl hover:shadow-blue-600/20"
                        title="Print Physical ID"
                      >
                        <Printer size={22} />
                      </button>
                      <button 
                        className="w-14 h-14 bg-slate-950 text-slate-400 rounded-2xl hover:bg-slate-800 flex items-center justify-center transition-all"
                        title="View Full Ledger"
                      >
                        <Hash size={22} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-32 text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-slate-950 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
              <QrCode size={48} className="text-slate-800" />
            </div>
            <p className="text-slate-600 font-bold italic text-xl uppercase tracking-tighter">Database Entry Point Not Found</p>
            <button onClick={() => onNavigate(Page.ENROLLMENT)} className="mt-6 text-blue-500 font-black uppercase text-xs tracking-[0.4em] underline hover:text-blue-400 transition-all">Initialize Enrollment Sequence</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRegistry;
