
import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Student, AttendanceRecord, Grade } from '../types';
import { Users, CheckCircle2, Circle, Search, ChevronDown, ChevronUp, MousePointerClick, AlertCircle } from 'lucide-react';

const ClassAttendance: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGrade, setExpandedGrade] = useState<Grade | null>('Grade 1');

  useEffect(() => {
    const unsubscribeStudents = storageService.listenStudents(setStudents);
    const unsubscribeAttendance = storageService.listenAttendance(setAttendance);
    return () => {
      unsubscribeStudents();
      unsubscribeAttendance();
    };
  }, []);

  const currentMonth = new Date().toISOString().slice(0, 7); 

  const grades: Grade[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'];

  const groupedData = useMemo(() => {
    const data: Record<string, Student[]> = {};
    grades.forEach(g => {
      data[g] = students.filter(s => 
        s.grade === g && 
        (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    return data;
  }, [students, searchTerm]);

  const getMonthlyAttendance = (studentId: string) => {
    return attendance.filter(a => a.studentId === studentId && a.date.startsWith(currentMonth));
  };

  const handleManualMark = async (student: Student) => {
    const today = new Date().toISOString().split('T')[0];
    const isPaid = student.lastPaymentMonth >= currentMonth;
    
    const alreadyMarked = attendance.some(a => a.studentId === student.id && a.date === today);
    if (alreadyMarked) {
      alert("Attendance already logged.");
      return;
    }

    if (!confirm(`Mark manual attendance for ${student.name} today?`)) {
      return;
    }

    await storageService.addAttendance({
      id: '',
      studentId: student.id,
      date: today,
      timestamp: Date.now()
    });
    
    if (isPaid) {
      audioService.playSuccess();
    } else {
      audioService.playWarning();
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-white">Monthly Register</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">Batch Tracking Protocol</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            placeholder="Filter Personnel..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 font-black focus:outline-none focus:border-blue-600 transition-all text-xs uppercase tracking-tight"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {grades.map(grade => {
          const studentsInGrade = groupedData[grade] || [];
          if (searchTerm && studentsInGrade.length === 0) return null;

          const isExpanded = expandedGrade === grade;

          return (
            <div key={grade} className="bg-slate-900/30 border border-slate-800/50 rounded-[2.5rem] overflow-hidden shadow-xl">
              <button 
                onClick={() => setExpandedGrade(isExpanded ? null : grade)}
                className="w-full p-8 flex items-center justify-between hover:bg-slate-800/30 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${studentsInGrade.length > 0 ? 'bg-blue-600/10 text-blue-500' : 'bg-slate-950 text-slate-700'}`}>
                    <Users size={28} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{grade}</h3>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{studentsInGrade.length} Registry Entries</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={24} className="text-slate-600" /> : <ChevronDown size={24} className="text-slate-600" />}
              </button>

              {isExpanded && (
                <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-slate-950 rounded-[2rem] border border-slate-800 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-900/50 border-b border-slate-800">
                        <tr>
                          <th className="p-5 text-[9px] font-black tracking-[0.3em] uppercase text-slate-500">Personnel</th>
                          <th className="p-5 text-[9px] font-black tracking-[0.3em] uppercase text-slate-500 text-center">Session Progress</th>
                          <th className="p-5 text-[9px] font-black tracking-[0.3em] uppercase text-slate-500 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {studentsInGrade.map(s => {
                          const records = getMonthlyAttendance(s.id);
                          const count = records.length;
                          const isUnpaid = s.lastPaymentMonth < currentMonth;

                          return (
                            <tr key={s.id} className={`hover:bg-slate-900/20 transition-all group ${isUnpaid ? 'bg-amber-500/[0.02]' : ''}`}>
                              <td className="p-5">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-3">
                                    <p className={`font-black text-sm uppercase tracking-tight ${isUnpaid ? 'text-amber-500' : 'text-slate-200'}`}>{s.name}</p>
                                    {isUnpaid && (
                                      <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full text-[7px] font-black tracking-widest uppercase border border-amber-500/20">
                                        <AlertCircle size={8} /> OVERDUE
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{s.id}</p>
                                </div>
                              </td>
                              <td className="p-5">
                                <div className="flex justify-center items-center gap-3">
                                  {[1, 2, 3, 4].map(idx => (
                                    <div key={idx} className="relative group/week">
                                      {idx <= count ? (
                                        <CheckCircle2 size={22} className="text-emerald-500" />
                                      ) : (
                                        <Circle size={22} className="text-slate-800" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="p-5 text-right">
                                <button 
                                  onClick={() => handleManualMark(s)}
                                  className={`p-2 px-4 rounded-xl transition-all border flex items-center gap-2 text-[8px] font-black uppercase tracking-widest ml-auto shadow-lg bg-slate-900 border-slate-800 ${
                                    isUnpaid 
                                      ? 'text-amber-500 hover:bg-amber-600 hover:text-white hover:border-amber-500' 
                                      : 'text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-500'
                                  }`}
                                >
                                  <MousePointerClick size={14} />
                                  Log Attendance
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClassAttendance;
