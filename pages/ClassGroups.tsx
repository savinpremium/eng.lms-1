
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Grade, ClassGroup } from '../types';
import { Users, Plus, Trash2, ExternalLink, X, BookOpen, Link as LinkIcon } from 'lucide-react';

interface ClassGroupsProps {
  institutionId: string;
}

const ClassGroups: React.FC<ClassGroupsProps> = ({ institutionId }) => {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState<Omit<ClassGroup, 'id'>>({
    name: '',
    grade: 'Grade 1',
    waLink: '',
    description: ''
  });

  useEffect(() => {
    // Scoped multi-tenant listener
    return storageService.listenClasses(institutionId, setClasses);
  }, [institutionId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Scoped saveClass call
    await storageService.saveClass(institutionId, { ...formData, id: '' } as ClassGroup);
    setShowAdd(false);
    setFormData({ name: '', grade: 'Grade 1', waLink: '', description: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remove this class batch? This will not delete the students.")) {
      // Scoped deleteClass call
      await storageService.deleteClass(institutionId, id);
    }
  };

  const grades: Grade[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'];

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-white">Class Batches</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">Batch Management & Group Communications</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center gap-3 transition-all shadow-xl shadow-blue-600/20"
        >
          <Plus size={18} />
          Create Batch
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
        {classes.map(cls => (
          <div key={cls.id} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[3.5rem] flex flex-col justify-between shadow-2xl relative group hover:border-blue-500/30 transition-all">
            <button 
              onClick={() => handleDelete(cls.id)}
              className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-rose-500 transition-all"
            >
              <Trash2 size={16}/>
            </button>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-blue-500">
                  <BookOpen size={24}/>
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">{cls.name}</h3>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">{cls.grade}</p>
                </div>
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight leading-relaxed line-clamp-2">{cls.description || 'No description provided.'}</p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
              {cls.waLink ? (
                <a 
                  href={cls.waLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors font-black uppercase text-[10px] tracking-widest"
                >
                  <LinkIcon size={14} />
                  WA Group
                </a>
              ) : (
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No Link</span>
              )}
              <button className="text-white hover:text-blue-500 transition-colors font-black uppercase text-[10px] tracking-widest">
                Edit Batch
              </button>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="lg:col-span-3 py-20 text-center opacity-20 border-2 border-dashed border-slate-800 rounded-[4rem]">
            <p className="font-black uppercase tracking-[0.5em] text-xs">No Class Batches Defined</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-lg p-10 rounded-[4rem] border border-slate-800 shadow-3xl space-y-8 animate-in zoom-in duration-300">
            <div className="text-center">
              <h4 className="text-3xl font-black tracking-tighter uppercase italic text-white">Batch Registry</h4>
              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-1">Institutional Group Setup</p>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">Batch Name</label>
                <input required placeholder="e.g. Monday Afternoons" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm focus:border-blue-600 focus:outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">Grade Level</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value as Grade})}>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">WhatsApp Invite Link</label>
                <input placeholder="https://chat.whatsapp.com/..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm focus:border-blue-600 focus:outline-none" value={formData.waLink} onChange={e => setFormData({...formData, waLink: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">Description</label>
                <textarea placeholder="Briefly describe this batch..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm focus:border-blue-600 focus:outline-none h-24 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl">Cancel</button>
                <button className="flex-1 py-4 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-blue-600/20">Save Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassGroups;
