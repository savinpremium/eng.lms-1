
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { ScheduleRecord, Grade } from '../types';
import { Calendar, Clock, MapPin, Plus, Trash2, X } from 'lucide-react';

interface ScheduleDeskProps {
  institutionId: string;
}

const ScheduleDesk: React.FC<ScheduleDeskProps> = ({ institutionId }) => {
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newSch, setNewSch] = useState<Omit<ScheduleRecord, 'id'>>({
    grade: 'Grade 1',
    day: 'Monday',
    time: '08:00',
    venue: 'Main Hall A'
  });

  useEffect(() => {
    // Scoped multi-tenant listener
    return storageService.listenSchedules(institutionId, setSchedules);
  }, [institutionId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Scoped saveSchedule call
    await storageService.saveSchedule(institutionId, { ...newSch, id: '' } as ScheduleRecord);
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this schedule entry?")) {
      // Scoped deleteSchedule call
      await storageService.deleteSchedule(institutionId, id);
    }
  };

  const days: ScheduleRecord['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const grades: Grade[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'];

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-white">Schedule</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">Institutional Resource & Class Matrix</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center gap-3 transition-all shadow-xl"
        >
          <Plus size={18} />
          Plan Session
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-700">
        {schedules.map(sch => (
          <div key={sch.id} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[3rem] shadow-2xl relative group hover:border-blue-500/30 transition-all">
            <button 
              onClick={() => handleDelete(sch.id)}
              className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-rose-500 transition-all"
            >
              <Trash2 size={16}/>
            </button>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-blue-500">
                  <Calendar size={24}/>
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">{sch.grade}</h3>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">{sch.day}</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-3 text-slate-400">
                  <Clock size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">{sch.time} HRS</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <MapPin size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">{sch.venue}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {schedules.length === 0 && (
          <div className="lg:col-span-3 py-20 text-center opacity-20 border-2 border-dashed border-slate-800 rounded-[4rem]">
            <p className="font-black uppercase tracking-[0.5em] text-xs">No Sessions Scheduled</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-lg p-10 rounded-[4rem] border border-slate-800 shadow-3xl space-y-8 animate-in zoom-in duration-300">
            <div className="text-center">
              <h4 className="text-3xl font-black tracking-tighter uppercase italic text-white">Session Plan</h4>
              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-1">Institutional Matrix Entry</p>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Level</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm" value={newSch.grade} onChange={e => setNewSch({...newSch, grade: e.target.value as Grade})}>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Day</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm" value={newSch.day} onChange={e => setNewSch({...newSch, day: e.target.value as any})}>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Time</label>
                  <input type="time" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm" value={newSch.time} onChange={e => setNewSch({...newSch, time: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Venue</label>
                  <input placeholder="Hall Name" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm" value={newSch.venue} onChange={e => setNewSch({...newSch, venue: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl">Abort</button>
                <button className="flex-1 py-4 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-blue-600/20">Authorize</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleDesk;
