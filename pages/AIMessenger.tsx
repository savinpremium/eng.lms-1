
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { generateWhatsAppDraft } from '../services/geminiService';
import { Student } from '../types';
import { MessageSquare, Send, Sparkles, Copy, Trash2, User, Search } from 'lucide-react';

const AIMessenger: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    return storageService.listenStudents(setStudents);
  }, []);

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = async (type: 'payment' | 'absence' | 'general') => {
    if (!selectedStudent) return;
    setIsGenerating(true);
    try {
      const text = await generateWhatsAppDraft(selectedStudent, type);
      setDraft(text);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft);
    alert("Draft linked to clipboard!");
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none mb-3">AI Intelligence</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.6em]">Automated Institutional Communications Gateway</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-slate-900/50 p-10 rounded-[4.5rem] border border-slate-800 h-fit space-y-8 shadow-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-4 italic">
              <User className="text-blue-500" size={28}/>
              Personnel
            </h3>
          </div>

          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-all" size={20} />
            <input 
              placeholder="QUICK SEARCH..."
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-16 pr-6 py-4 text-xs font-black tracking-widest focus:outline-none focus:border-blue-600 transition-all shadow-inner uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
            {filtered.map(s => (
              <button 
                key={s.id}
                onClick={() => { setSelectedStudent(s); setDraft(''); }}
                className={`w-full p-6 rounded-[2.5rem] flex items-center justify-between transition-all group ${
                  selectedStudent?.id === s.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/20 scale-[1.02]' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="text-left">
                  <p className="font-black tracking-tight text-lg uppercase leading-none mb-1 group-hover:translate-x-1 transition-transform">{s.name}</p>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${selectedStudent?.id === s.id ? 'text-blue-100' : 'text-slate-600'}`}>ID: ${s.id} • ${s.grade}</p>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center text-slate-700 font-bold text-xs uppercase tracking-widest py-10 italic">No records found</p>}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-10">
          {selectedStudent ? (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-10">
              <div className="bg-slate-900 border-2 border-slate-800 p-12 rounded-[5rem] shadow-3xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                  <div>
                    <h4 className="text-4xl font-black tracking-tighter uppercase italic leading-none mb-2">Draft Terminal</h4>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Engine: Google Gemini-3 Flash-Preview</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleGenerate('payment')}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-[2rem] font-black text-xs tracking-widest uppercase flex items-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                    >
                      <Sparkles size={18} />
                      Billing Notice
                    </button>
                    <button 
                      onClick={() => handleGenerate('absence')}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-[2rem] font-black text-xs tracking-widest uppercase flex items-center gap-3 transition-all active:scale-95"
                    >
                      Absence Alert
                    </button>
                  </div>
                </div>

                <div className="relative group">
                  <textarea 
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-[3.5rem] p-12 min-h-[400px] text-xl font-medium leading-relaxed focus:outline-none focus:border-blue-600 transition-all resize-none shadow-inner"
                    value={isGenerating ? 'INITIALIZING NEURAL DRAFTING ENGINE...' : draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Authorize a communication protocol above to initiate drafting..."
                  />
                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md rounded-[3.5rem] flex flex-col items-center justify-center gap-6 animate-in fade-in">
                       <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-blue-500 font-black uppercase text-[10px] tracking-[0.6em]">Generating Draft...</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center mt-10 gap-6">
                  <div className="flex gap-4">
                    <button 
                      onClick={copyToClipboard}
                      className="w-16 h-16 bg-slate-800 text-slate-400 rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center shadow-xl shadow-black/20"
                      title="Link to Clipboard"
                    >
                      <Copy size={24} />
                    </button>
                    <button 
                      onClick={() => setDraft('')}
                      className="w-16 h-16 bg-slate-800 text-slate-400 rounded-2xl hover:bg-rose-500/20 hover:text-rose-500 transition-all flex items-center justify-center shadow-xl shadow-black/20"
                      title="Clear Buffer"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                  
                  <a 
                    href={`https://wa.me/${selectedStudent.contact.replace(/\s+/g, '')}?text=${encodeURIComponent(draft)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-7 rounded-[2.5rem] font-black tracking-tighter text-2xl flex items-center justify-center gap-4 transition-all shadow-3xl shadow-emerald-600/20 uppercase"
                  >
                    Send to WhatsApp
                    <Send size={32} />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-900/10 border-4 border-dashed border-slate-800/50 rounded-[6rem] flex flex-col items-center justify-center text-slate-800 p-24 text-center">
              <div className="w-32 h-32 bg-slate-900/50 rounded-[3rem] flex items-center justify-center mb-10 border border-slate-800/50 shadow-inner">
                <MessageSquare size={56} className="opacity-10" />
              </div>
              <h4 className="text-4xl font-black uppercase tracking-tighter italic opacity-60">Communication Node</h4>
              <p className="text-xl font-bold opacity-30 mt-4 leading-relaxed max-w-sm mx-auto">Select a verified personnel profile to authorize AI-powered drafting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMessenger;
