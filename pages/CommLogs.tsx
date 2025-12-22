
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Student, MessageLog } from '../types';
import { History, Search, Filter, MessageSquare, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';

const CommLogs: React.FC = () => {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    storageService.listenLogs(setLogs);
    storageService.listenStudents(setStudents);
  }, []);

  const getStudentName = (id: string) => {
    const s = students.find(stud => stud.id === id);
    return s ? s.name : 'Unknown Student';
  };

  const filteredLogs = logs.filter(l => 
    l.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getStudentName(l.studentId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-white">Audit Hub</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">Communication Logs & Gateway History</p>
        </div>
      </header>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            placeholder="SEARCH LOGS OR STUDENTS..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 font-black focus:outline-none focus:border-blue-600 transition-all text-[10px] uppercase tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-slate-500 hover:text-white transition-all">
          <Filter size={18} />
        </button>
      </div>

      <div className="bg-slate-900/30 border-2 border-slate-800 rounded-[4rem] overflow-hidden shadow-3xl animate-in slide-in-from-bottom-8 duration-700">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500">Timestamp</th>
              <th className="p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500">Personnel</th>
              <th className="p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500">Category</th>
              <th className="p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500">Content</th>
              <th className="p-8 text-[9px] font-black tracking-[0.4em] uppercase text-slate-500 text-right">Gate Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-900/50 transition-all group">
                <td className="p-8">
                  <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                    <Clock size={12}/>
                    {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </td>
                <td className="p-8">
                  <p className="font-black text-white uppercase text-sm">{getStudentName(log.studentId)}</p>
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{log.studentId}</p>
                </td>
                <td className="p-8">
                  <span className="bg-slate-950 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border border-slate-800">
                    {log.type}: {log.category}
                  </span>
                </td>
                <td className="p-8">
                  <p className="text-[10px] text-slate-400 max-w-xs font-medium uppercase tracking-tight">{log.content}</p>
                </td>
                <td className="p-8 text-right">
                  <div className={`inline-flex items-center gap-2 font-black text-[9px] uppercase tracking-widest ${log.status === 'Sent' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {log.status === 'Sent' ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                    {log.status}
                  </div>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-20 text-center opacity-20">
                  <p className="font-black uppercase tracking-[0.5em] text-xs">No Communication Logs Found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommLogs;
