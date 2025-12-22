
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { Student, Page } from '../types';
import { UserPlus, Search, Printer, QrCode } from 'lucide-react';

const StudentRegistry: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
  const students = storageService.getStudents();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintCard = (student: Student) => {
    const printEl = document.getElementById('print-section');
    if (!printEl) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.id}`;

    printEl.innerHTML = `
      <div style="
        width: 85.6mm; 
        height: 53.98mm; 
        padding: 0; 
        font-family: 'Inter', sans-serif; 
        color: white; 
        background: #020617; 
        border-radius: 3.18mm; 
        overflow: hidden; 
        display: flex; 
        position: relative;
        box-sizing: border-box;
      ">
        <div style="position: absolute; top: -20mm; right: -20mm; width: 60mm; height: 60mm; background: #2563eb; opacity: 0.15; border-radius: 50%;"></div>
        
        <div style="flex: 0 0 35mm; background: white; padding: 5mm; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid #1e293b;">
          <img src="${qrUrl}" style="width: 25mm; height: 25mm; border: 1px solid #eee;" />
          <p style="color: #020617; font-size: 7pt; font-weight: 900; margin-top: 2mm; letter-spacing: 0.5px; opacity: 0.6;">SCAN AT GATE</p>
        </div>
        
        <div style="flex: 1; padding: 5mm 7mm; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 2mm; margin-bottom: 2mm;">
               <div style="width: 4mm; height: 4mm; background: #2563eb; border-radius: 1mm;"></div>
               <h1 style="font-size: 8pt; font-weight: 900; letter-spacing: -0.5px; margin: 0; color: #3b82f6; text-transform: uppercase;">Excellence English</h1>
            </div>
            <p style="font-size: 5pt; letter-spacing: 2px; font-weight: 800; color: #64748b; margin: 0; text-transform: uppercase;">Institutional Identity</p>
          </div>
          
          <div>
            <h2 style="font-size: 11pt; font-weight: 900; margin: 0; line-height: 1.1; color: #f8fafc; text-transform: uppercase;">${student.name}</h2>
            <p style="font-size: 8pt; font-weight: 900; color: #3b82f6; margin: 1mm 0;">${student.id}</p>
          </div>
          
          <div style="display: flex; gap: 5mm;">
            <div>
              <p style="font-size: 4.5pt; font-weight: 900; color: #475569; margin: 0; letter-spacing: 1px; text-transform: uppercase;">Academic Grade</p>
              <p style="font-size: 7pt; font-weight: 900; margin: 0;">${student.grade}</p>
            </div>
            <div>
              <p style="font-size: 4.5pt; font-weight: 900; color: #475569; margin: 0; letter-spacing: 1px; text-transform: uppercase;">Intake Year</p>
              <p style="font-size: 7pt; font-weight: 900; margin: 0;">2025</p>
            </div>
          </div>
        </div>
        
        <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 1.5mm; background: linear-gradient(to right, #2563eb, #3b82f6);"></div>
      </div>
    `;
    window.print();
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase">Student Records</h1>
          <p className="text-slate-500 font-bold">Secure database of institutional personnel and IDs.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              placeholder="Search IDs..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 font-bold focus:outline-none focus:border-blue-600 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => onNavigate(Page.ENROLLMENT)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center gap-2 transition-all shadow-lg shadow-blue-600/10"
          >
            <UserPlus size={16} />
            Enroll New
          </button>
        </div>
      </header>

      <div className="bg-slate-900/30 rounded-[4rem] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="p-8 text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Personnel Identity</th>
                <th className="p-8 text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Academic Grade</th>
                <th className="p-8 text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Latest Payment</th>
                <th className="p-8 text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-slate-900/50 transition-all group">
                  <td className="p-8">
                    <p className="font-black text-lg tracking-tight uppercase">{student.name}</p>
                    <p className="text-blue-500 font-bold uppercase text-[10px] tracking-widest">{student.id}</p>
                  </td>
                  <td className="p-8">
                    <span className="bg-slate-800 px-4 py-2 rounded-full font-black text-xs text-slate-300">{student.grade}</span>
                  </td>
                  <td className="p-8 text-emerald-500 font-black text-xs uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       SETTLED: {student.lastPaymentMonth}
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handlePrintCard(student)}
                        className="p-3 bg-slate-800 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg"
                        title="Print Physical ID"
                      >
                        <Printer size={18} />
                      </button>
                      <button 
                        className="p-3 bg-slate-800 text-slate-400 rounded-2xl hover:bg-slate-700 transition-all"
                        title="View Full Ledger"
                      >
                        <QrCode size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-24 text-center">
            <UserPlus size={48} className="mx-auto text-slate-800 mb-6" />
            <p className="text-slate-500 font-bold italic text-lg">No institutional records found.</p>
            <button onClick={() => onNavigate(Page.ENROLLMENT)} className="mt-4 text-blue-500 font-black uppercase text-xs tracking-widest underline">Initialize First Enrollment</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRegistry;
