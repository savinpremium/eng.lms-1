
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { generateWhatsAppDraft } from '../services/geminiService';
import { Student } from '../types';
import { MessageSquare, Send, Sparkles, Copy, Trash2, User } from 'lucide-react';

const AIMessenger: React.FC = () => {
  const students = storageService.getStudents();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (type: 'payment' | 'absence' | 'general') => {
    if (!selectedStudent) return;
    setIsGenerating(true);
    const text = await generateWhatsAppDraft(selectedStudent, type);
    setDraft(text);
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft);
    alert("Message copied to clipboard!");
  };

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-5xl font-black tracking-tighter uppercase">AI Messenger</h1>
        <p className="text-slate-500 font-bold">Automated parent communication via Gemini Intelligence.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Student Selector */}
        <div className="bg-slate-900/50 p-8 rounded-[4rem] border border-slate-800 h-fit space-y-8">
          <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <User className="text-blue-500" />
            Recipients
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {students.map(s => (
              <button 
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={`w-full p-6 rounded-[2.5rem] flex items-center justify-between transition-all ${
                  selectedStudent?.id === s.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="text-left">
                  <p className="font-black tracking-tight">{s.name}</p>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${selectedStudent?.id === s.id ? 'text-blue-100' : 'text-slate-600'}`}>Parent: {s.parentName}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center/Right: Message Terminal */}
        <div className="lg:col-span-2 space-y-8">
          {selectedStudent ? (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
              <div className="bg-slate-900 border border-slate-800 p-10 rounded-[4rem] shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                  <div>
                    <h4 className="text-3xl font-black tracking-tighter uppercase">Draft Intelligence</h4>
                    <p className="text-slate-500 font-bold">Powered by Google Gemini-3 Flash</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleGenerate('payment')}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center gap-2"
                    >
                      <Sparkles size={16} />
                      Fees Notice
                    </button>
                    <button 
                      onClick={() => handleGenerate('absence')}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center gap-2"
                    >
                      Absence
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-[3rem] p-10 min-h-[300px] text-lg font-medium leading-relaxed focus:outline-none focus:border-blue-600 transition-all resize-none"
                    value={isGenerating ? 'Analyzing data and drafting message...' : draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Select a message type above to generate a draft..."
                  />
                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm rounded-[3rem] flex items-center justify-center">
                       <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-8">
                  <div className="flex gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="p-4 bg-slate-800 text-slate-400 rounded-2xl hover:bg-slate-700 transition-all"
                      title="Copy Draft"
                    >
                      <Copy size={20} />
                    </button>
                    <button 
                      onClick={() => setDraft('')}
                      className="p-4 bg-slate-800 text-slate-400 rounded-2xl hover:bg-rose-500/20 hover:text-rose-500 transition-all"
                      title="Clear"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  <a 
                    href={`https://wa.me/${selectedStudent.contact.replace(/\s+/g, '')}?text=${encodeURIComponent(draft)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-3xl font-black tracking-tighter text-xl flex items-center gap-3 transition-all shadow-xl shadow-emerald-600/20"
                  >
                    SEND TO PARENT
                    <Send size={24} />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[5rem] flex flex-col items-center justify-center text-slate-700 p-20 text-center">
              <MessageSquare size={80} className="mb-8 opacity-10" />
              <h4 className="text-3xl font-black uppercase tracking-tighter mb-2">Message Terminal</h4>
              <p className="text-lg font-bold opacity-30">Select a student from the left panel to begin drafting an AI-powered message.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMessenger;
