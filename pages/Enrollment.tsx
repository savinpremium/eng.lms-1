
import React, { useState } from 'react';
import { Grade, Student } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { toPng } from 'html-to-image';
import { UserPlus, ArrowRight, ShieldCheck, Info, Printer, CheckCircle, Loader2 } from 'lucide-react';

const Enrollment: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Grade 6' as Grade,
    parentName: '',
    contact: ''
  });
  const [loading, setLoading] = useState(false);
  const [successStudent, setSuccessStudent] = useState<Student | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const year = new Date().getFullYear();
    const id = `STU-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent: Student = {
      ...formData,
      id,
      lastPaymentMonth: `${year}-01`,
      registrationDate: new Date().toISOString().split('T')[0]
    };
    
    await storageService.saveStudent(newStudent);
    audioService.playSuccess();
    setLoading(false);
    setSuccessStudent(newStudent);
  };

  const handlePrintID = async () => {
    if (!successStudent) return;
    setIsGenerating(true);
    
    const buffer = document.getElementById('render-buffer');
    const printSection = document.getElementById('print-section');
    if (!buffer || !printSection) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${successStudent.id}`;

    buffer.innerHTML = `
      <div id="enroll-id-capture" style="width: 85.6mm; height: 53.98mm; padding: 0; font-family: 'Inter', sans-serif; color: white; background: #020617; border-radius: 12px; overflow: hidden; display: flex; position: relative; box-sizing: border-box;">
        <div style="position: absolute; top: -15mm; right: -15mm; width: 45mm; height: 45mm; background: #2563eb; opacity: 0.2; border-radius: 50%;"></div>
        <div style="flex: 0 0 34mm; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 2px solid #1e293b; z-index: 10;">
          <img src="${qrUrl}" style="width: 26mm; height: 26mm; margin-bottom: 2mm;" />
          <div style="color: #020617; font-size: 7pt; font-weight: 900; letter-spacing: 1px; background: #f1f5f9; padding: 1mm 3mm; border-radius: 4px;">PASS KEY</div>
        </div>
        <div style="flex: 1; padding: 6mm 8mm; display: flex; flex-direction: column; justify-content: space-between; z-index: 10;">
          <div>
            <h1 style="font-size: 12pt; font-weight: 900; color: #3b82f6; margin: 0; text-transform: uppercase; line-height: 1;">Excellence English</h1>
            <p style="font-size: 5pt; letter-spacing: 2px; font-weight: 800; color: #64748b; margin: 0; text-transform: uppercase;">Professional Network</p>
          </div>
          <div style="margin: 1.5mm 0;">
            <p style="font-size: 4.5pt; font-weight: 900; color: #3b82f6; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Institutional Pass</p>
            <h2 style="font-size: 14pt; font-weight: 900; margin: 0.5mm 0; color: #f8fafc; text-transform: uppercase; letter-spacing: -0.5px;">${successStudent.name}</h2>
            <p style="font-size: 10pt; font-weight: 900; color: #3b82f6; margin: 0.5mm 0; font-family: monospace; letter-spacing: 1px;">${successStudent.id}</p>
          </div>
          <div style="display: flex; gap: 6mm;">
            <div>
              <p style="font-size: 4pt; font-weight: 900; color: #475569; margin: 0; text-transform: uppercase;">Grade</p>
              <p style="font-size: 8.5pt; font-weight: 900; margin: 0;">${successStudent.grade}</p>
            </div>
            <div>
              <p style="font-size: 4pt; font-weight: 900; color: #475569; margin: 0; text-transform: uppercase;">Status</p>
              <p style="font-size: 8.5pt; font-weight: 900; margin: 0; color: #10b981;">ACTIVE</p>
            </div>
          </div>
        </div>
        <div style="position: absolute; bottom: 0; left: 34mm; right: 0; height: 2mm; background: #2563eb;"></div>
      </div>
    `;

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const target = document.getElementById('enroll-id-capture');
      if (target) {
        const dataUrl = await toPng(target, { pixelRatio: 3 });
        printSection.innerHTML = `<img src="${dataUrl}" style="width: 85.6mm; height: 53.98mm;" />`;
        window.print();
        printSection.innerHTML = '';
      }
    } catch (error) {
      console.error('Failed to capture enrollment ID image:', error);
    } finally {
      buffer.innerHTML = '';
      setIsGenerating(false);
    }
  };

  if (successStudent) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in zoom-in-95 duration-700 pb-20">
        <div className="bg-slate-900/50 p-10 md:p-16 rounded-[4rem] border border-slate-800 text-center space-y-10 md:space-y-12 shadow-3xl">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle size={56} />
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic mb-4 leading-none">Enrollment Verified</h2>
            <p className="text-slate-400 font-bold max-w-md mx-auto text-base md:text-lg leading-relaxed">Personnel <b>{successStudent.name}</b> has been successfully provisioned with ID <b>{successStudent.id}</b>.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center">
            <button 
              onClick={handlePrintID}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 md:px-12 py-5 md:py-6 rounded-2xl font-black flex items-center justify-center gap-4 transition-all shadow-xl shadow-blue-600/20 uppercase tracking-[0.2em] text-[10px] md:text-xs disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}
              Print PVC Card
            </button>
            <button 
              onClick={onComplete}
              className="bg-slate-800 hover:bg-slate-700 text-white px-10 md:px-12 py-5 md:py-6 rounded-2xl font-black flex items-center justify-center gap-4 transition-all uppercase tracking-[0.2em] text-[10px] md:text-xs"
            >
              Go to Registry
            </button>
          </div>
          
          <button onClick={() => setSuccessStudent(null)} className="text-slate-600 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.5em] hover:text-white transition-all">Submit Next Applicant</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 md:space-y-12 pb-20">
      <header className="flex justify-between items-end animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">Register Now</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[9px] md:text-[10px] mt-3">Personnel Provisioning • Cycle 2025</p>
        </div>
        <div className="hidden lg:flex items-center gap-6 text-slate-800 opacity-30">
           <ShieldCheck size={56} />
           <UserPlus size={56} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <div className="lg:col-span-2 bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-800 shadow-3xl">
          <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              <div className="space-y-3 md:space-y-4">
                <label className="block text-[9px] md:text-[10px] font-black tracking-[0.5em] uppercase text-slate-600">Personnel Full Name</label>
                <input 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl px-6 py-4 md:py-6 focus:border-blue-600 focus:outline-none font-bold text-lg md:text-xl shadow-inner transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-3 md:space-y-4">
                <label className="block text-[9px] md:text-[10px] font-black tracking-[0.5em] uppercase text-slate-600">Academic Level</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl px-6 py-4 md:py-6 focus:border-blue-600 focus:outline-none appearance-none font-bold text-lg md:text-xl shadow-inner transition-all"
                  value={formData.grade}
                  onChange={e => setFormData({...formData, grade: e.target.value as Grade})}
                >
                  <option>Grade 6</option>
                  <option>Grade 7</option>
                  <option>Grade 8</option>
                  <option>Grade 9</option>
                  <option>O/L</option>
                  <option>A/L</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              <div className="space-y-3 md:space-y-4">
                <label className="block text-[9px] md:text-[10px] font-black tracking-[0.5em] uppercase text-slate-600">WhatsApp Contact</label>
                <input 
                  required
                  placeholder="07XXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl px-6 py-4 md:py-6 focus:border-blue-600 focus:outline-none font-bold text-lg md:text-xl shadow-inner transition-all"
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                />
              </div>
              <div className="space-y-3 md:space-y-4">
                <label className="block text-[9px] md:text-[10px] font-black tracking-[0.5em] uppercase text-slate-600">Parent / Guardian</label>
                <input 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl px-6 py-4 md:py-6 focus:border-blue-600 focus:outline-none font-bold text-lg md:text-xl shadow-inner transition-all"
                  value={formData.parentName}
                  onChange={e => setFormData({...formData, parentName: e.target.value})}
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 md:py-8 rounded-2xl md:rounded-[3rem] flex items-center justify-center gap-4 md:gap-5 transition-all transform hover:scale-[1.01] shadow-2xl shadow-blue-600/30 uppercase tracking-tighter text-xl md:text-2xl"
            >
              {loading ? "PROVISIONING..." : "CONFIRM ENROLLMENT"}
              {!loading && <ArrowRight size={28} />}
            </button>
          </form>
        </div>

        <div className="space-y-8 md:space-y-10">
          <div className="bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-3xl relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-600/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600/10 text-blue-500 rounded-xl md:rounded-[1.8rem] flex items-center justify-center mb-6 md:mb-10 shadow-inner">
              <ShieldCheck size={36} />
            </div>
            <h4 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-3 md:mb-4 italic">Security Link</h4>
            <p className="text-slate-500 text-xs md:text-sm font-bold leading-relaxed">Enrollment data is anchored to the institutional pass system for zero-collision gate authorization.</p>
          </div>

          <div className="bg-slate-950 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-slate-900 shadow-3xl">
            <div className="flex items-center gap-3 md:gap-4 text-emerald-500 mb-6 md:mb-8">
              <Info size={24} />
              <h4 className="font-black text-[9px] md:text-xs uppercase tracking-[0.5em]">Gate Protocols</h4>
            </div>
            <ul className="space-y-4 md:space-y-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] leading-relaxed">
              <li className="flex gap-4"><span className="text-blue-600 font-black">01</span> Card printer linked</li>
              <li className="flex gap-4"><span className="text-blue-600 font-black">02</span> AI drafts authorized</li>
              <li className="flex gap-4"><span className="text-blue-600 font-black">03</span> Database sync active</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrollment;
