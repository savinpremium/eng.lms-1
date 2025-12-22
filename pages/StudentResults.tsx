
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Student, ResultRecord, Grade } from '../types';
import { GraduationCap, Search, Plus, Trophy, TrendingUp, Filter } from 'lucide-react';

const StudentResults: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newRes, setNewRes] = useState({
    studentId: '',
    examName: '',
    score: 0,
    grade: 'Grade 1' as Grade
  });

  useEffect(() => {
    storageService.listenStudents(setStudents);
    storageService.listenResults(setResults);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await storageService.saveResult({
      ...newRes,
      id: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAdd(false);
    setNewRes({ studentId: '', examName: '', score: 0, grade: 'Grade 1' as Grade });
  };

  const filteredResults = results.filter(r => {
    const s = students.find(stud => stud.id === r.studentId);
    const studentName = s?.name.toLowerCase() || '';
    return studentName.includes(searchTerm.toLowerCase()) || r.examName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-white">Assessment</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">Performance Analytics & Academic Progress</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center gap-3 transition-all shadow-xl shadow-blue-600/20"
        >
          <Plus size={18} />
          Record Score
        </button>
      </header>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            placeholder="SEARCH BY STUDENT OR EXAM..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 font-black focus:outline-none focus:border-blue-600 transition-all text-[10px] uppercase tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-slate-500 hover:text-white transition-all">
          <Filter size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-700">
        {filteredResults.map(res => {
          const student = students.find(s => s.id === res.studentId);
          return (
            <div key={res.id} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                <Trophy size={64} />
              </div>
              <div className="relative z-10">
                <p className="text-[9px] font-black text-blue-500 tracking-[0.4em] uppercase mb-4">{res.examName}</p>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2 leading-none">{student?.name || 'Unknown Student'}</h3>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-8">{res.grade} • {res.date}</p>
                
                <div className="flex items-end justify-between">
                  <div className="bg-slate-950 px-6 py-4 rounded-2xl border border-slate-800">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Score Result</p>
                    <p className="text-3xl font-black text-emerald-500 italic">{res.score}%</p>
                  </div>
                  <div className="flex items-center gap-2 text-blue-500 animate-pulse">
                    <TrendingUp size={16} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Progress Active</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-lg p-10 rounded-[4rem] border border-slate-800 shadow-3xl space-y-8 animate-in zoom-in duration-300">
            <div className="text-center">
              <h4 className="text-3xl font-black tracking-tighter uppercase italic text-white">Entry Protocol</h4>
              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-1">Record Assessment Evaluation</p>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <select 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm focus:border-blue-600 focus:outline-none appearance-none"
                  value={newRes.studentId}
                  onChange={(e) => setNewRes({...newRes, studentId: e.target.value})}
                >
                  <option value="">Select Student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                </select>
                <input 
                  required
                  placeholder="Exam / Test Name (e.g., Monthly Test Oct)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm focus:border-blue-600 focus:outline-none"
                  value={newRes.examName}
                  onChange={(e) => setNewRes({...newRes, examName: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number"
                    max="100"
                    placeholder="Score %"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm focus:border-blue-600 focus:outline-none"
                    value={newRes.score}
                    onChange={(e) => setNewRes({...newRes, score: parseInt(e.target.value) || 0})}
                  />
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm focus:border-blue-600 focus:outline-none appearance-none"
                    value={newRes.grade}
                    onChange={(e) => setNewRes({...newRes, grade: e.target.value as Grade})}
                  >
                    {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-4 bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-750"
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-4 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-blue-500 shadow-xl shadow-blue-600/20"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResults;
