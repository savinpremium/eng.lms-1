
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { Student } from '../types';
import { UserPlus, Search, Printer, QrCode } from 'lucide-react';

const StudentRegistry: React.FC = () => {
  const students = storageService.getStudents();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintCard = (student: Student) => {
    const printEl = document.getElementById('print-section');
    if (!printEl) return;

    printEl.innerHTML = `
      <div style="width: 85.6mm; height: 53.98mm; padding: 20px; font-family: 'Inter', sans-serif; color: white; background: #020617; border-radius: 5mm; display: flex; gap: 20px; align-items: center; border: 2px solid #1e293b;">
        <div style="flex: 0 0 35%; background: white; padding: 10px; border-radius: 5mm; display: flex; align-items: center; justify-content: center;">
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: black;">
             <svg width="100" height="100" viewBox="0 0 100 100">
               <rect x="10" y="10" width="80" height="80" fill="none" stroke="black" stroke-width="4" />
               <rect x="20" y="20" width="20" height="20" fill="black" />
               <rect x="60" y="20" width="20" height="20" fill="black" />
               <rect x="20" y="60" width="20" height="20" fill="black" />
             </svg>
          </div>
        </div>
        <div style="flex: 1;">
          <h1 style="font-size: 14px; font-weight: 900; letter-spacing: -1px; margin: 0; color: #3b82f6;">EXCELLENCE ENGLISH</h1>
          <p style="font-size: 8px; letter-spacing: 2px; font-weight: 700; color: #64748b; margin: 2px 0 15px 0;">STUDENT IDENTITY</p>
          <h2 style="font-size: 18px; font-weight: 900; margin: 0; line-height: 1;">${student.name.toUpperCase()}</h2>
          <p style="font-size: 12px; font-weight: 900; color: #2563eb; margin: 5px 0;">${student.id}</p>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <div>
              <p style="font-size: 6px; font-weight: 900; color: #64748b; margin: 0; letter-spacing: 1px;">GRADE</p>
              <p style="font-size: 10px; font-weight: 900; margin: 0;">${student.grade}</p>
            </div>
            <div>
              <p style="font-size: 6px; font-weight: 900; color: #64748b; margin: 0; letter-spacing: 1px;">YEAR</p>
              <p style="font-size: 10px; font-weight: 900; margin: 0;">2025</p>
            </div>
          </div>
        </div>
      </div>
    `;
    window.print();
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase">Student Registry</h1>
          <p className="text-slate-500 font-bold">Manage core institutional human database.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            placeholder="Search by name or ID..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 font-bold focus:outline-none focus:border-blue-600 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-slate-900/30 rounded-[4rem] border border-slate-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="p-8 text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Student Identity</th>
              <th className="p-8 text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Grade</th>
              <th className="p-8 text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Payment Status</th>
              <th className="p-8 text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map(student => (
              <tr key={student.id} className="hover:bg-slate-900/50 transition-all group">
                <td className="p-8">
                  <p className="font-black text-lg tracking-tight">{student.name}</p>
                  <p className="text-blue-500 font-bold uppercase text-[10px] tracking-widest">{student.id}</p>
                </td>
                <td className="p-8">
                  <span className="bg-slate-800 px-4 py-2 rounded-full font-black text-xs">{student.grade}</span>
                </td>
                <td className="p-8">
                  <span className="flex items-center gap-2 font-bold text-sm text-emerald-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    PAID {student.lastPaymentMonth}
                  </span>
                </td>
                <td className="p-8">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePrintCard(student)}
                      className="p-3 bg-slate-800 text-slate-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                      title="Print PVC Card"
                    >
                      <Printer size={18} />
                    </button>
                    <button 
                      className="p-3 bg-slate-800 text-slate-400 rounded-2xl hover:bg-slate-700 transition-all"
                      title="View Profile"
                    >
                      <QrCode size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-20 text-center">
            <UserPlus size={48} className="mx-auto text-slate-800 mb-4" />
            <p className="text-slate-500 font-bold italic">No students found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRegistry;
