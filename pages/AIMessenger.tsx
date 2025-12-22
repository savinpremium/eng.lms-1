
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { generateWhatsAppDraft, MessageType } from '../services/geminiService';
import { Student, ClassGroup } from '../types';
import { MessageSquare, Send, Sparkles, Copy, Trash2, User, Search, Loader2, Calendar, BookOpen, UserPlus, Type as TypeIcon, AlertTriangle, Users } from 'lucide-react';

const AIMessenger: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [customEng, setCustomEng] = useState('');
  const [customSin, setCustomSin] = useState('');

  useEffect(() => {
    storageService.listenStudents(setStudents);
    storageService.listenClasses(setClasses);
  }, []);

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = async (type: MessageType) => {
    if (!selectedStudent && !selectedClass) {
      alert("Please select a student or a class first.");
      return;
    }
    setManualMode(false);
    setIsGenerating(true);
    setDraft('');
    try {
      const text = await generateWhatsAppDraft(
        selectedStudent, 
        type, 
        customPrompt, 
        selectedClass || undefined
      );
      setDraft(text);
    } catch (e) {
      console.error(e);
      setDraft('Error generating draft. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (manualMode && (selectedStudent || selectedClass)) {
      const header = "EXCELLENCE ENGLISH - OFFICIAL UPDATE\n\n";
      const target = selectedStudent ? `Regarding ${selectedStudent.name}\n` : `Class: ${selectedClass?.name}\n`;
      const bodyEng = customEng ? customEng + "\n\n" : "";
      const bodySin = customSin ? customSin + "\n\n" : "";
      const footer = "Excellence English Office | 077 123 4567\nThank you / ස්තුතියි.";
      setDraft(header + target + "\n" + bodyEng + bodySin + footer);
    }
  }, [customEng, customSin, manualMode, selectedStudent, selectedClass]);

  const copyToClipboard = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    alert('Draft copied to clipboard');
  };

  const sendWhatsApp = () => {
    if (!draft) return;
    const phone = selectedStudent ? selectedStudent.contact.replace(/\D/g, '') : '';
    const encodedText = encodeURIComponent(draft);
    
    if (selectedClass && selectedClass.waLink) {
      window.open(selectedClass.waLink, '_blank');
      return;
    }

    const waPhone = phone.startsWith('0') ? '94' + phone.substring(1) : phone;
    window.open(`https://wa.me/${waPhone}?text=${encodedText}`, '_blank');
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Human Messenger</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">Warm & Support Communications Hub</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8 animate-in slide-in-from-left-8 duration-700">
          <div className="bg-slate-900/50 p-8 rounded-[3.5rem] border border-slate-800 shadow-2xl">
            <div className="flex gap-4 mb-8">
               <button 
                 onClick={() => { setSelectedClass(null); setSelectedStudent(null); }}
                 className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${!selectedClass ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
               >
                 Individual
               </button>
               <button 
                 onClick={() => { setSelectedStudent(null); setSelectedClass(classes[0] || null); }}
                 className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${selectedClass ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
               >
                 Class Group
               </button>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                placeholder={selectedClass ? "SELECT CLASS BATCH..." : "SEARCH STUDENTS..."}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 font-black focus:outline-none focus:border-blue-600 transition-all text-xs uppercase tracking-tight"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedClass ? (
                classes.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => setSelectedClass(c)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border ${
                      selectedClass?.id === c.id 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-black text-sm uppercase tracking-tight">{c.name}</p>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${selectedClass?.id === c.id ? 'text-blue-200' : 'text-slate-600'}`}>{c.grade}</p>
                    </div>
                    <Users size={18} />
                  </button>
                ))
              ) : (
                filtered.map(s => (
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
                ))
              )}
            </div>
          </div>

          {(selectedStudent || selectedClass) && (
            <div className="bg-slate-900/50 p-8 rounded-[3.5rem] border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 ml-2">Human Intent (AI Helper)</label>
                  <textarea 
                    placeholder="E.g. Tell them the class fee for January is now due, but keep it very polite and warm."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 font-bold text-xs h-24 focus:border-blue-500 outline-none transition-all resize-none"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                  <button 
                    onClick={() => handleGenerate('custom')}
                    disabled={isGenerating || !customPrompt}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    Transform into Polite Message
                  </button>
                </div>

                <div className="relative flex items-center gap-4 py-2">
                  <div className="flex-1 h-[1px] bg-slate-800"></div>
                  <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Or Preset Modes</span>
                  <div className="flex-1 h-[1px] bg-slate-800"></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <button onClick={() => handleGenerate('payment_received')} className="flex flex-col items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-emerald-500 transition-all group">
                    <Sparkles size={20} className="text-emerald-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Fee Settled</span>
                  </button>
                  <button onClick={() => handleGenerate('payment_late')} className="flex flex-col items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-rose-500 transition-all group">
                    <AlertTriangle size={20} className="text-rose-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Fee Reminder</span>
                  </button>
                  <button onClick={() => handleGenerate('class_notes')} className="flex flex-col items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500 transition-all group">
                    <BookOpen size={20} className="text-blue-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Class Notes</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
          <div className="bg-slate-900 p-10 rounded-[4rem] border border-slate-800 shadow-3xl min-h-[500px] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Polite Draft</h3>
              {draft && (
                <button onClick={() => setDraft('')} className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-slate-700 hover:text-rose-500 transition-all border border-slate-800">
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-800/50 rounded-[2.5rem] p-8 text-slate-300 font-medium leading-relaxed whitespace-pre-wrap relative overflow-hidden group shadow-inner">
              {isGenerating && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                  <Loader2 className="animate-spin text-blue-500" size={48} />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 animate-pulse">Humanizing the message...</p>
                </div>
              )}
              {draft || (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <MessageSquare size={64} className="mb-6" />
                  <p className="font-black uppercase tracking-widest text-xs">Awaiting Target Selection</p>
                </div>
              )}
            </div>

            {draft && (
              <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                <button onClick={copyToClipboard} className="bg-slate-800 hover:bg-slate-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all">
                  <Copy size={18} />
                  Copy Both
                </button>
                <button onClick={sendWhatsApp} className="bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 transition-all transform hover:scale-[1.02]">
                  <Send size={18} />
                  {selectedClass ? 'Open Group' : 'Dispatch WA'}
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
