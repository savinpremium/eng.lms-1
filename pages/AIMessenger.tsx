
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { generateWhatsAppDraft } from '../services/geminiService';
import { Student } from '../types';
import { MessageSquare, Send, Sparkles, Copy, Trash2, User, Search, Loader2 } from 'lucide-react';

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
    setDraft('');
    try {
      const text = await generateWhatsAppDraft(selectedStudent, type);
      setDraft(text);
    } catch (e) {
      console.error(e);
      setDraft('Error generating draft. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    alert('Message copied to clipboard');
  };

  const sendWhatsApp = () => {
    if (!selectedStudent || !draft) return;
    // Basic phone formatting for Sri Lanka (assuming local number starting with 0)
    const phone = selectedStudent.contact.replace(/\D/g, '');
    const encodedText = encodeURIComponent(draft);
    const waPhone = phone.startsWith('0') ? '94' + phone.substring(1) : phone;
    window.open(`https://wa.me/${waPhone}?text=${encodedText}`, '_blank');
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">AI Messenger</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">Automated Parent Communication Protocol</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8 animate-in slide-in-from-left-8 duration-700">
          <div className="bg-slate-900/50 p-8 rounded-[3.5rem] border border-slate-800 shadow-2xl">
            <div className="relative mb-8">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                placeholder="SEARCH PERSONNEL..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 font-black focus:outline-none focus:border-blue-600 transition-all text-xs uppercase tracking-tight"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filtered.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border ${
                    selectedStudent?.id === s.id 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-black text-sm uppercase tracking-tight">{s.name}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${selectedStudent?.id === s.id ? 'text-blue-200' : 'text-slate-600'}`}>{s.id}</p>
                  </div>
                  <User size={18} className={selectedStudent?.id === s.id ? 'text-white' : 'text-slate-700'} />
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="py-12 text-center opacity-30 italic text-xs uppercase tracking-widest font-bold">No Records Matched</div>
              )}
            </div>
          </div>

          {selectedStudent && (
            <div className="bg-slate-900/50 p-8 rounded-[3.5rem] border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-500">
              <p className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-6">Select Message Purpose</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => handleGenerate('payment')}
                  disabled={isGenerating}
                  className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-[2rem] hover:border-blue-500 transition-all group"
                >
                  <Sparkles size={24} className="text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Fees Due</span>
                </button>
                <button 
                  onClick={() => handleGenerate('absence')}
                  disabled={isGenerating}
                  className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-[2rem] hover:border-rose-500 transition-all group"
                >
                  <MessageSquare size={24} className="text-rose-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Absence</span>
                </button>
                <button 
                  onClick={() => handleGenerate('general')}
                  disabled={isGenerating}
                  className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-[2rem] hover:border-emerald-500 transition-all group"
                >
                  <Send size={24} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">General</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
          <div className="bg-slate-900 p-10 rounded-[4rem] border border-slate-800 shadow-3xl min-h-[500px] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Draft Preview</h3>
              {draft && (
                <button 
                  onClick={() => setDraft('')}
                  className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-slate-700 hover:text-rose-500 transition-all border border-slate-800"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-[2.5rem] p-8 text-slate-300 font-medium leading-relaxed whitespace-pre-wrap relative overflow-hidden group">
              {isGenerating && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                  <Loader2 className="animate-spin text-blue-500" size={48} />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 animate-pulse">Consulting Gemini AI...</p>
                </div>
              )}
              {draft || (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <MessageSquare size={64} className="mb-6" />
                  <p className="font-black uppercase tracking-widest text-xs">No active draft session</p>
                </div>
              )}
            </div>

            {draft && (
              <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                <button 
                  onClick={copyToClipboard}
                  className="bg-slate-800 hover:bg-slate-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all"
                >
                  <Copy size={18} />
                  Copy Text
                </button>
                <button 
                  onClick={sendWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 transition-all"
                >
                  <Send size={18} />
                  Open WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMessenger;
