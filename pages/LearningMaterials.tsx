
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { MaterialRecord, Grade } from '../types';
import { LibraryBig, Search, Plus, FileText, Video, ExternalLink, Download } from 'lucide-react';

interface LearningMaterialsProps {
  institutionId: string;
}

const LearningMaterials: React.FC<LearningMaterialsProps> = ({ institutionId }) => {
  const [materials, setMaterials] = useState<MaterialRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newMat, setNewMat] = useState<Omit<MaterialRecord, 'id' | 'date'>>({
    title: '',
    description: '',
    link: '',
    grade: 'Grade 1',
    type: 'PDF'
  });

  useEffect(() => {
    // Scoped listener for multi-tenant data
    return storageService.listenMaterials(institutionId, setMaterials);
  }, [institutionId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Scoped saveMaterial call
    await storageService.saveMaterial(institutionId, {
      ...newMat,
      id: '',
      date: new Date().toISOString().split('T')[0]
    } as MaterialRecord);
    setShowAdd(false);
    setNewMat({ title: '', description: '', link: '', grade: 'Grade 1', type: 'PDF' });
  };

  const filtered = materials.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (type: string) => {
    switch(type) {
      case 'PDF': return <FileText size={24} className="text-rose-500" />;
      case 'Video': return <Video size={24} className="text-blue-500" />;
      default: return <ExternalLink size={24} className="text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-white">Study Hub</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">Digital Learning Assets & Material Library</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center gap-3 transition-all shadow-xl shadow-blue-600/20"
        >
          <Plus size={18} />
          Upload Asset
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          placeholder="SEARCH RESOURCE TITLE OR GRADE..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 font-black focus:outline-none focus:border-blue-600 transition-all text-[10px] uppercase tracking-widest"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
        {filtered.map(mat => (
          <div key={mat.id} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[3.5rem] flex flex-col justify-between shadow-2xl hover:border-blue-500/30 transition-all">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {getIcon(mat.type)}
                </div>
                <span className="text-[9px] font-black text-slate-600 tracking-widest uppercase">{mat.date}</span>
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2 leading-none">{mat.title}</h3>
                <p className="text-slate-500 text-[10px] font-medium leading-relaxed uppercase tracking-tight">{mat.description}</p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-800/50 flex items-center justify-between">
              <span className="bg-blue-600/10 text-blue-500 px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest">{mat.grade}</span>
              <button 
                onClick={() => window.open(mat.link, '_blank')}
                className="flex items-center gap-2 text-white hover:text-blue-500 transition-colors font-black uppercase text-[10px] tracking-widest"
              >
                Access Hub
                <Download size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-lg p-10 rounded-[4rem] border border-slate-800 shadow-3xl space-y-8 animate-in zoom-in duration-300">
            <div className="text-center">
              <h4 className="text-3xl font-black tracking-tighter uppercase italic text-white">Hub Provision</h4>
              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-1">Deploy New Digital Asset</p>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <input required placeholder="Asset Title" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm focus:border-blue-600 focus:outline-none" value={newMat.title} onChange={(e) => setNewMat({...newMat, title: e.target.value})} />
              <textarea required placeholder="Brief Metadata Description" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm focus:border-blue-600 focus:outline-none h-24" value={newMat.description} onChange={(e) => setNewMat({...newMat, description: e.target.value})} />
              <input required placeholder="Resource Link (Drive / Video URL)" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm focus:border-blue-600 focus:outline-none" value={newMat.link} onChange={(e) => setNewMat({...newMat, link: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm" value={newMat.type} onChange={(e) => setNewMat({...newMat, type: e.target.value as any})}>
                  <option>PDF</option>
                  <option>Video</option>
                  <option>Link</option>
                </select>
                <select className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm" value={newMat.grade} onChange={(e) => setNewMat({...newMat, grade: e.target.value as Grade})}>
                  {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 font-black uppercase text-[10px] rounded-2xl">Abort</button>
                <button className="flex-1 py-4 bg-blue-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-xl shadow-blue-600/20">Authorize Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningMaterials;
